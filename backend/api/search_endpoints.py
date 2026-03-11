"""
Search API endpoints: tracks, artists, albums, playlists, users
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models.db_models import Track, Playlist, User
from utils.database import get_db
from utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/search", tags=["Search"])


# Response models
class TrackSearchResult(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: Optional[int]
    thumbnail_url: Optional[str]
    genre: Optional[str]
    mood: Optional[str]
    play_count: int

    class Config:
        from_attributes = True


class ArtistSearchResult(BaseModel):
    name: str
    track_count: int


class AlbumSearchResult(BaseModel):
    album: str
    artist: str
    track_count: int


class PlaylistSearchResult(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_username: str
    is_public: bool

    class Config:
        from_attributes = True


class UserSearchResult(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]

    class Config:
        from_attributes = True


@router.get("/tracks", response_model=List[TrackSearchResult])
async def search_tracks(
    q: str = Query(..., min_length=1, description="Search query"),
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Full-text search on tracks with optional filters

    - **q**: Search query (searches title, artist, album)
    - **genre**: Optional genre filter
    - **mood**: Optional mood filter
    - **limit**: Max results (1-100, default 20)
    - **offset**: Pagination offset
    """
    query = db.query(Track)

    # Case-insensitive search across title, artist, and album
    search_filter = (
        Track.title.ilike(f"%{q}%") |
        Track.artist.ilike(f"%{q}%") |
        Track.album.ilike(f"%{q}%")
    )
    query = query.filter(search_filter)

    # Apply optional filters
    if genre:
        query = query.filter(Track.genre == genre)
    if mood:
        query = query.filter(Track.mood == mood)

    # Order by relevance (exact matches first, then by play count)
    query = query.order_by(Track.play_count.desc())

    tracks = query.offset(offset).limit(limit).all()
    return tracks


@router.get("/artists", response_model=List[ArtistSearchResult])
async def search_artists(
    q: str = Query(..., min_length=1, description="Artist name search query"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search for artists by name

    Returns unique artists with track counts
    """
    from sqlalchemy import func, distinct

    artists = db.query(
        Track.artist,
        func.count(distinct(Track.id)).label('track_count')
    ).filter(
        Track.artist.ilike(f"%{q}%")
    ).group_by(Track.artist).order_by(
        func.count(distinct(Track.id)).desc()
    ).limit(limit).all()

    return [{"name": a[0], "track_count": a[1]} for a in artists]


@router.get("/albums", response_model=List[AlbumSearchResult])
async def search_albums(
    q: str = Query(..., min_length=1, description="Album name search query"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search for albums by name

    Returns unique albums with their artists and track counts
    """
    from sqlalchemy import func, distinct

    albums = db.query(
        Track.album,
        Track.artist,
        func.count(distinct(Track.id)).label('track_count')
    ).filter(
        Track.album.ilike(f"%{q}%")
    ).group_by(Track.album, Track.artist).order_by(
        func.count(distinct(Track.id)).desc()
    ).limit(limit).all()

    return [{"album": a[0], "artist": a[1], "track_count": a[2]} for a in albums]


@router.get("/playlists", response_model=List[PlaylistSearchResult])
async def search_playlists(
    q: str = Query(..., min_length=1, description="Playlist name search query"),
    public_only: bool = Query(True, description="Only search public playlists"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search for playlists by name

    - **q**: Search query
    - **public_only**: If true, only returns public playlists
    """
    query = db.query(Playlist).join(User, Playlist.owner_id == User.id).filter(
        Playlist.name.ilike(f"%{q}%")
    )

    if public_only:
        query = query.filter(Playlist.is_public == True)

    playlists = query.limit(limit).all()

    # Add owner username to response
    results = []
    for playlist in playlists:
        owner = db.query(User).filter(User.id == playlist.owner_id).first()
        results.append({
            "id": playlist.id,
            "name": playlist.name,
            "description": playlist.description,
            "owner_username": owner.username if owner else "Unknown",
            "is_public": playlist.is_public
        })

    return results


@router.get("/users", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=1, description="Username or display name search query"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search for users by username or display name
    """
    users = db.query(User).filter(
        (User.username.ilike(f"%{q}%")) |
        (User.display_name.ilike(f"%{q}%"))
    ).limit(limit).all()

    return users

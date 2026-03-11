"""
Discovery API endpoints: browse genres, moods, trending, new releases
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from models.db_models import Track, Playlist, PlaylistTrack, ListeningHistory
from utils.database import get_db

router = APIRouter(prefix="/api/discover", tags=["Discovery"])


# Response models
class GenreResponse(BaseModel):
    genre: str
    count: int


class MoodResponse(BaseModel):
    mood: str
    count: int


class TrackResponse(BaseModel):
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


class TrendingTrackResponse(BaseModel):
    track: TrackResponse
    recent_plays: int

    class Config:
        from_attributes = True


class PopularPlaylistResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cover_image_url: Optional[str]
    owner_username: str
    track_count: int
    is_public: bool

    class Config:
        from_attributes = True


@router.get("/genres", response_model=List[GenreResponse])
async def get_genres(db: Session = Depends(get_db)):
    """
    Get all genres with track counts

    Returns genres sorted by track count (most popular first)
    """
    genres = db.query(
        Track.genre,
        func.count(Track.id).label('track_count')
    ).filter(
        Track.genre.isnot(None),
        Track.genre != ''
    ).group_by(Track.genre).order_by(desc('track_count')).all()

    return [{"genre": g[0], "count": g[1]} for g in genres]


@router.get("/genres/{genre}/tracks", response_model=List[TrackResponse])
async def get_genre_tracks(
    genre: str,
    limit: int = Query(50, ge=1, le=200),
    sort: str = Query("popular", regex="^(popular|recent)$"),
    db: Session = Depends(get_db)
):
    """
    Get tracks by genre

    - **genre**: Genre name
    - **limit**: Max tracks to return (1-200, default 50)
    - **sort**: Sort order - "popular" (by play count) or "recent" (by added date)
    """
    query = db.query(Track).filter(Track.genre == genre)

    if sort == "popular":
        query = query.order_by(Track.play_count.desc())
    elif sort == "recent":
        query = query.order_by(Track.created_at.desc())

    return query.limit(limit).all()


@router.get("/moods", response_model=List[MoodResponse])
async def get_moods(db: Session = Depends(get_db)):
    """
    Get all moods with track counts

    Returns moods sorted by track count (most popular first)
    """
    moods = db.query(
        Track.mood,
        func.count(Track.id).label('track_count')
    ).filter(
        Track.mood.isnot(None),
        Track.mood != ''
    ).group_by(Track.mood).order_by(desc('track_count')).all()

    return [{"mood": m[0], "count": m[1]} for m in moods]


@router.get("/moods/{mood}/tracks", response_model=List[TrackResponse])
async def get_mood_tracks(
    mood: str,
    limit: int = Query(50, ge=1, le=200),
    sort: str = Query("popular", regex="^(popular|recent)$"),
    db: Session = Depends(get_db)
):
    """
    Get tracks by mood

    - **mood**: Mood name (e.g., "energetic", "calm", "sad")
    - **limit**: Max tracks to return (1-200, default 50)
    - **sort**: Sort order - "popular" or "recent"
    """
    query = db.query(Track).filter(Track.mood == mood)

    if sort == "popular":
        query = query.order_by(Track.play_count.desc())
    elif sort == "recent":
        query = query.order_by(Track.created_at.desc())

    return query.limit(limit).all()


@router.get("/trending", response_model=List[TrendingTrackResponse])
async def get_trending(
    timeframe: str = Query("week", regex="^(day|week|month|all)$"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get trending tracks based on recent play count

    - **timeframe**: "day", "week", "month", or "all"
    - **limit**: Max tracks to return (1-200, default 50)

    Trending is calculated by counting plays within the timeframe
    """
    # Calculate timeframe cutoff
    now = datetime.utcnow()
    if timeframe == "day":
        since = now - timedelta(days=1)
    elif timeframe == "week":
        since = now - timedelta(weeks=1)
    elif timeframe == "month":
        since = now - timedelta(days=30)
    else:  # all time
        since = datetime.min

    # Query most played tracks in timeframe
    trending = db.query(
        Track,
        func.count(ListeningHistory.id).label('recent_plays')
    ).join(
        ListeningHistory, Track.id == ListeningHistory.track_id
    ).filter(
        ListeningHistory.played_at >= since
    ).group_by(Track.id).order_by(desc('recent_plays')).limit(limit).all()

    # If no listening history data, fall back to play_count
    if not trending:
        tracks = db.query(Track).order_by(Track.play_count.desc()).limit(limit).all()
        return [{"track": t, "recent_plays": t.play_count} for t in tracks]

    return [{"track": t[0], "recent_plays": t[1]} for t in trending]


@router.get("/new-releases", response_model=List[TrackResponse])
async def get_new_releases(
    days: int = Query(30, ge=1, le=365, description="Days to look back"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get recently added tracks

    - **days**: How many days back to look (1-365, default 30)
    - **limit**: Max tracks to return (1-200, default 50)
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    tracks = db.query(Track).filter(
        Track.created_at >= cutoff
    ).order_by(Track.created_at.desc()).limit(limit).all()

    return tracks


@router.get("/popular-playlists", response_model=List[PopularPlaylistResponse])
async def get_popular_playlists(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get popular public playlists

    Sorted by track count (playlists with more tracks appear first)
    """
    from models.db_models import User

    playlists = db.query(
        Playlist,
        func.count(PlaylistTrack.id).label('track_count')
    ).join(
        PlaylistTrack, Playlist.id == PlaylistTrack.playlist_id, isouter=True
    ).filter(
        Playlist.is_public == True
    ).group_by(Playlist.id).order_by(desc('track_count')).limit(limit).all()

    # Add owner username
    results = []
    for playlist, track_count in playlists:
        owner = db.query(User).filter(User.id == playlist.owner_id).first()
        results.append({
            "id": playlist.id,
            "name": playlist.name,
            "description": playlist.description,
            "cover_image_url": playlist.cover_image_url,
            "owner_username": owner.username if owner else "Unknown",
            "track_count": track_count,
            "is_public": playlist.is_public
        })

    return results


@router.get("/artist/{artist_name}/tracks", response_model=List[TrackResponse])
async def get_artist_tracks(
    artist_name: str,
    limit: int = Query(100, ge=1, le=500),
    sort: str = Query("popular", regex="^(popular|recent|album)$"),
    db: Session = Depends(get_db)
):
    """
    Get all tracks by an artist

    - **artist_name**: Artist name (exact match)
    - **limit**: Max tracks to return (1-500, default 100)
    - **sort**: Sort order - "popular", "recent", or "album"
    """
    query = db.query(Track).filter(Track.artist == artist_name)

    if sort == "popular":
        query = query.order_by(Track.play_count.desc())
    elif sort == "recent":
        query = query.order_by(Track.created_at.desc())
    elif sort == "album":
        query = query.order_by(Track.album, Track.title)

    return query.limit(limit).all()


@router.get("/album/{artist_name}/{album_name}/tracks", response_model=List[TrackResponse])
async def get_album_tracks(
    artist_name: str,
    album_name: str,
    db: Session = Depends(get_db)
):
    """
    Get all tracks from a specific album

    - **artist_name**: Artist name (exact match)
    - **album_name**: Album name (exact match)
    """
    tracks = db.query(Track).filter(
        Track.artist == artist_name,
        Track.album == album_name
    ).order_by(Track.title).all()

    return tracks

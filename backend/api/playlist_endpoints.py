from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_

from utils.auth import get_current_user
from utils.database import get_db
from models.db_models import Playlist, PlaylistSong, Song, User

router = APIRouter(prefix="/playlists", tags=["playlists"])


# Pydantic schemas
class PlaylistCreate(BaseModel):
    name: str


class PlaylistUpdate(BaseModel):
    name: str


class PlaylistResponse(BaseModel):
    id: int
    name: str
    song_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SongInPlaylist(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: int | None
    file_path: str
    added_at: datetime

    class Config:
        from_attributes = True


class AddSongRequest(BaseModel):
    song_id: int


# Playlist CRUD endpoints
@router.get("", response_model=List[PlaylistResponse])
async def get_user_playlists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all playlists for the current user"""
    playlists = db.query(Playlist).filter(Playlist.user_id == current_user.id).all()

    # Add song count to each playlist
    result = []
    for playlist in playlists:
        song_count = db.query(PlaylistSong).filter(
            PlaylistSong.playlist_id == playlist.id
        ).count()

        result.append(PlaylistResponse(
            id=playlist.id,
            name=playlist.name,
            song_count=song_count,
            created_at=playlist.created_at,
            updated_at=playlist.updated_at
        ))

    return result


@router.post("", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    playlist_data: PlaylistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new playlist for the current user"""
    # Check if playlist name already exists for this user
    existing = db.query(Playlist).filter(
        and_(
            Playlist.user_id == current_user.id,
            Playlist.name == playlist_data.name
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Playlist '{playlist_data.name}' already exists"
        )

    # Create new playlist
    new_playlist = Playlist(
        user_id=current_user.id,
        name=playlist_data.name
    )
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)

    return PlaylistResponse(
        id=new_playlist.id,
        name=new_playlist.name,
        song_count=0,
        created_at=new_playlist.created_at,
        updated_at=new_playlist.updated_at
    )


@router.put("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int,
    playlist_data: PlaylistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update (rename) a playlist"""
    # Get playlist and verify ownership
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    if playlist.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this playlist"
        )

    # Check if new name conflicts with another playlist
    existing = db.query(Playlist).filter(
        and_(
            Playlist.user_id == current_user.id,
            Playlist.name == playlist_data.name,
            Playlist.id != playlist_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Playlist '{playlist_data.name}' already exists"
        )

    # Update playlist
    playlist.name = playlist_data.name
    playlist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(playlist)

    # Get song count
    song_count = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist.id
    ).count()

    return PlaylistResponse(
        id=playlist.id,
        name=playlist.name,
        song_count=song_count,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at
    )


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(
    playlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a playlist"""
    # Get playlist and verify ownership
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    if playlist.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this playlist"
        )

    # Delete playlist (cascade will delete playlist_songs)
    db.delete(playlist)
    db.commit()

    return None


# Playlist songs endpoints
@router.get("/{playlist_id}/songs", response_model=List[SongInPlaylist])
async def get_playlist_songs(
    playlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all songs in a playlist"""
    # Get playlist and verify ownership
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    if playlist.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this playlist"
        )

    # Get songs in playlist with join
    playlist_songs = db.query(PlaylistSong, Song).join(
        Song, PlaylistSong.song_id == Song.id
    ).filter(
        PlaylistSong.playlist_id == playlist_id
    ).order_by(
        PlaylistSong.position
    ).all()

    result = []
    for ps, song in playlist_songs:
        result.append(SongInPlaylist(
            id=song.id,
            title=song.title,
            artist=song.artist,
            album=song.album,
            duration=song.duration,
            file_path=song.file_path,
            added_at=ps.added_at
        ))

    return result


@router.post("/{playlist_id}/songs", status_code=status.HTTP_201_CREATED)
async def add_song_to_playlist(
    playlist_id: int,
    song_data: AddSongRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a song to a playlist"""
    # Get playlist and verify ownership
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    if playlist.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this playlist"
        )

    # Verify song exists
    song = db.query(Song).filter(Song.id == song_data.song_id).first()
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )

    # Check if song already in playlist
    existing = db.query(PlaylistSong).filter(
        and_(
            PlaylistSong.playlist_id == playlist_id,
            PlaylistSong.song_id == song_data.song_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Song already in playlist"
        )

    # Get max position for ordering
    max_position = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist_id
    ).count()

    # Add song to playlist
    playlist_song = PlaylistSong(
        playlist_id=playlist_id,
        song_id=song_data.song_id,
        position=max_position
    )
    db.add(playlist_song)

    # Update playlist updated_at
    playlist.updated_at = datetime.utcnow()

    db.commit()

    return {"message": "Song added to playlist successfully"}


@router.delete("/{playlist_id}/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_song_from_playlist(
    playlist_id: int,
    song_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a song from a playlist"""
    # Get playlist and verify ownership
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    if playlist.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this playlist"
        )

    # Find and delete the playlist-song relationship
    playlist_song = db.query(PlaylistSong).filter(
        and_(
            PlaylistSong.playlist_id == playlist_id,
            PlaylistSong.song_id == song_id
        )
    ).first()

    if not playlist_song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found in playlist"
        )

    # Delete the relationship
    db.delete(playlist_song)

    # Update playlist updated_at
    playlist.updated_at = datetime.utcnow()

    db.commit()

    return None

"""
Radio API endpoints: Dynamic radio stations based on seeds (track, artist, genre, mood)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Literal
from pydantic import BaseModel
from models.db_models import Track, TrackSimilarity
from utils.database import get_db
from utils.auth import get_current_user
import random

router = APIRouter(prefix="/api/radio", tags=["Radio"])


# Request/Response models
class RadioStationRequest(BaseModel):
    seed_type: Literal["track", "artist", "genre", "mood"]
    seed_value: str | int  # track_id (int) or artist/genre/mood name (str)


class RadioStationResponse(BaseModel):
    station_id: str
    station_name: str
    description: str
    tracks: List[dict]


class RadioTrackResponse(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: Optional[int]
    thumbnail_url: Optional[str]
    genre: Optional[str]
    mood: Optional[str]

    class Config:
        from_attributes = True


@router.post("/start-station", response_model=RadioStationResponse)
async def start_radio_station(
    request: RadioStationRequest,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Start a radio station based on seed

    **Seed Types:**
    - `track`: Start radio based on a specific track (seed_value = track_id)
    - `artist`: Start radio based on artist (seed_value = artist name)
    - `genre`: Start radio based on genre (seed_value = genre name)
    - `mood`: Start radio based on mood (seed_value = mood name)

    Returns station ID and initial batch of tracks
    """
    tracks = []
    station_name = ""
    description = ""

    if request.seed_type == "track":
        # Get similar tracks based on track_id
        try:
            seed_track_id = int(request.seed_value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="seed_value must be an integer for track seed_type"
            )

        seed_track = db.query(Track).filter(Track.id == seed_track_id).first()
        if not seed_track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seed track not found"
            )

        station_name = f"{seed_track.title} Radio"
        description = f"Based on {seed_track.title} by {seed_track.artist}"

        # Get similar tracks from TrackSimilarity table
        similar_tracks = db.query(Track).join(
            TrackSimilarity, Track.id == TrackSimilarity.track_id_2
        ).filter(
            TrackSimilarity.track_id_1 == seed_track_id
        ).order_by(
            TrackSimilarity.similarity_score.desc()
        ).limit(limit).all()

        if not similar_tracks:
            # Fallback: same genre/mood
            similar_tracks = db.query(Track).filter(
                Track.id != seed_track_id,
                ((Track.genre == seed_track.genre) | (Track.mood == seed_track.mood))
            ).order_by(func.random()).limit(limit).all()

        # Include seed track at the beginning
        tracks = [seed_track] + similar_tracks

    elif request.seed_type == "artist":
        # Get tracks by artist
        artist = str(request.seed_value)
        station_name = f"{artist} Radio"
        description = f"Songs by {artist} and similar artists"

        # Get artist's tracks
        artist_tracks = db.query(Track).filter(
            Track.artist == artist
        ).order_by(func.random()).limit(limit // 2).all()

        if not artist_tracks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tracks found for artist '{artist}'"
            )

        # Get similar tracks based on genre/mood
        genres = set([t.genre for t in artist_tracks if t.genre])
        moods = set([t.mood for t in artist_tracks if t.mood])

        similar_tracks = []
        if genres or moods:
            query = db.query(Track).filter(Track.artist != artist)
            if genres:
                query = query.filter(Track.genre.in_(genres))
            if moods:
                query = query.filter(Track.mood.in_(moods))
            similar_tracks = query.order_by(func.random()).limit(limit // 2).all()

        tracks = artist_tracks + similar_tracks

    elif request.seed_type == "genre":
        # Get tracks by genre
        genre = str(request.seed_value)
        station_name = f"{genre.title()} Radio"
        description = f"The best of {genre} music"

        tracks = db.query(Track).filter(
            Track.genre == genre
        ).order_by(func.random()).limit(limit).all()

        if not tracks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tracks found for genre '{genre}'"
            )

    elif request.seed_type == "mood":
        # Get tracks by mood
        mood = str(request.seed_value)
        station_name = f"{mood.title()} Radio"
        description = f"Music to match your {mood} mood"

        tracks = db.query(Track).filter(
            Track.mood == mood
        ).order_by(func.random()).limit(limit).all()

        if not tracks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tracks found for mood '{mood}'"
            )

    # Shuffle for variety
    if len(tracks) > 1:
        seed_track = tracks[0] if request.seed_type == "track" else None
        remaining = tracks[1:] if seed_track else tracks
        random.shuffle(remaining)
        tracks = [seed_track] + remaining if seed_track else remaining

    # Convert to dict
    track_dicts = [
        {
            "id": t.id,
            "title": t.title,
            "artist": t.artist,
            "album": t.album,
            "duration": t.duration,
            "thumbnail_url": t.thumbnail_url,
            "genre": t.genre,
            "mood": t.mood,
        }
        for t in tracks[:limit]
    ]

    station_id = f"{request.seed_type}:{request.seed_value}"

    return {
        "station_id": station_id,
        "station_name": station_name,
        "description": description,
        "tracks": track_dicts
    }


@router.get("/next-tracks/{station_id}", response_model=List[RadioTrackResponse])
async def get_next_radio_tracks(
    station_id: str,
    count: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get next batch of tracks for an active radio station

    Station ID format: `{seed_type}:{seed_value}`
    Example: `track:123`, `artist:Linkin Park`, `genre:rock`

    Use offset to paginate through station tracks
    """
    try:
        seed_type, seed_value = station_id.split(":", 1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid station_id format. Expected 'seed_type:seed_value'"
        )

    tracks = []

    if seed_type == "track":
        try:
            track_id = int(seed_value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid track ID in station_id"
            )

        # Get similar tracks
        tracks = db.query(Track).join(
            TrackSimilarity, Track.id == TrackSimilarity.track_id_2
        ).filter(
            TrackSimilarity.track_id_1 == track_id
        ).order_by(
            func.random()
        ).offset(offset).limit(count).all()

    elif seed_type == "artist":
        artist = seed_value
        tracks = db.query(Track).filter(
            Track.artist == artist
        ).order_by(func.random()).offset(offset).limit(count).all()

    elif seed_type == "genre":
        genre = seed_value
        tracks = db.query(Track).filter(
            Track.genre == genre
        ).order_by(func.random()).offset(offset).limit(count).all()

    elif seed_type == "mood":
        mood = seed_value
        tracks = db.query(Track).filter(
            Track.mood == mood
        ).order_by(func.random()).offset(offset).limit(count).all()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown seed_type: {seed_type}"
        )

    return tracks


@router.get("/my-stations", response_model=List[dict])
async def get_my_radio_stations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized radio station suggestions for current user

    Returns suggested radio stations based on:
    - User's favorite tracks
    - User's top genres
    - User's top moods
    """
    from models.db_models import UserFavorite, ListeningHistory
    from datetime import datetime, timedelta

    stations = []

    # Get user's favorite tracks for track-based stations
    favorite_tracks = db.query(Track).join(
        UserFavorite, Track.id == UserFavorite.track_id
    ).filter(
        UserFavorite.user_id == current_user.id
    ).order_by(
        UserFavorite.favorited_at.desc()
    ).limit(5).all()

    for track in favorite_tracks:
        stations.append({
            "station_id": f"track:{track.id}",
            "station_name": f"{track.title} Radio",
            "description": f"Based on {track.title} by {track.artist}",
            "seed_type": "track",
            "thumbnail_url": track.thumbnail_url
        })

    # Get user's top genres
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    top_genres = db.query(
        Track.genre,
        func.count(ListeningHistory.id).label('play_count')
    ).join(
        ListeningHistory, Track.id == ListeningHistory.track_id
    ).filter(
        ListeningHistory.user_id == current_user.id,
        ListeningHistory.played_at >= thirty_days_ago,
        Track.genre.isnot(None)
    ).group_by(Track.genre).order_by(
        func.count(ListeningHistory.id).desc()
    ).limit(3).all()

    for genre, _ in top_genres:
        stations.append({
            "station_id": f"genre:{genre}",
            "station_name": f"{genre.title()} Radio",
            "description": f"The best of {genre} music",
            "seed_type": "genre",
            "thumbnail_url": None
        })

    # Get user's top moods
    top_moods = db.query(
        Track.mood,
        func.count(ListeningHistory.id).label('play_count')
    ).join(
        ListeningHistory, Track.id == ListeningHistory.track_id
    ).filter(
        ListeningHistory.user_id == current_user.id,
        ListeningHistory.played_at >= thirty_days_ago,
        Track.mood.isnot(None)
    ).group_by(Track.mood).order_by(
        func.count(ListeningHistory.id).desc()
    ).limit(3).all()

    for mood, _ in top_moods:
        stations.append({
            "station_id": f"mood:{mood}",
            "station_name": f"{mood.title()} Radio",
            "description": f"Music to match your {mood} mood",
            "seed_type": "mood",
            "thumbnail_url": None
        })

    return stations

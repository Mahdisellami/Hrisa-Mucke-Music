from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from utils.auth import get_current_user
from utils.database import get_db
from models.db_models import User, Track, ListeningHistory, TrackRating

router = APIRouter(prefix="/analytics", tags=["analytics"])


# Pydantic schemas
class PlayHistoryCreate(BaseModel):
    track_id: int
    duration_played: int  # seconds
    completed: bool
    source: Optional[str] = None  # "playlist", "album", "search", etc.
    source_id: Optional[int] = None


class PlayHistoryResponse(BaseModel):
    id: int
    track_id: int
    track_title: str
    track_artist: str
    played_at: datetime
    duration_played: int
    completed: bool

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    total_plays: int
    total_listening_time: int  # seconds
    unique_tracks: int
    favorite_count: int
    average_completion_rate: float
    top_artist: Optional[str]
    top_genre: Optional[str]
    listening_streak_days: int
    member_since: datetime


class TopTrackResponse(BaseModel):
    track_id: int
    title: str
    artist: str
    album: Optional[str]
    play_count: int
    total_listening_time: int

    class Config:
        from_attributes = True


class RatingCreate(BaseModel):
    track_id: int
    rating: int  # 1-5
    review: Optional[str] = None


class RatingUpdate(BaseModel):
    rating: int  # 1-5
    review: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    track_id: int
    track_title: str
    track_artist: str
    rating: int
    review: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Play History Endpoints
@router.post("/play-history", status_code=status.HTTP_201_CREATED)
async def record_play(
    play_data: PlayHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a play event"""
    # Verify track exists
    track = db.query(Track).filter(Track.id == play_data.track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    # Create play history entry
    history_entry = ListeningHistory(
        user_id=current_user.id,
        track_id=play_data.track_id,
        duration_played=play_data.duration_played,
        completed=play_data.completed,
        source=play_data.source,
        source_id=play_data.source_id
    )
    db.add(history_entry)

    # Update track play count
    track.play_count = (track.play_count or 0) + 1

    db.commit()
    db.refresh(history_entry)

    return {"message": "Play recorded successfully", "id": history_entry.id}


@router.get("/play-history", response_model=List[PlayHistoryResponse])
async def get_play_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's play history"""
    history_entries = db.query(ListeningHistory, Track).join(
        Track, ListeningHistory.track_id == Track.id
    ).filter(
        ListeningHistory.user_id == current_user.id
    ).order_by(
        desc(ListeningHistory.played_at)
    ).limit(limit).offset(offset).all()

    result = []
    for history, track in history_entries:
        result.append(PlayHistoryResponse(
            id=history.id,
            track_id=track.id,
            track_title=track.title,
            track_artist=track.artist,
            played_at=history.played_at,
            duration_played=history.duration_played,
            completed=history.completed
        ))

    return result


# Statistics Endpoints
@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user statistics"""
    # Total plays
    total_plays = db.query(func.count(ListeningHistory.id)).filter(
        ListeningHistory.user_id == current_user.id
    ).scalar() or 0

    # Total listening time
    total_listening_time = db.query(func.sum(ListeningHistory.duration_played)).filter(
        ListeningHistory.user_id == current_user.id
    ).scalar() or 0

    # Unique tracks
    unique_tracks = db.query(func.count(func.distinct(ListeningHistory.track_id))).filter(
        ListeningHistory.user_id == current_user.id
    ).scalar() or 0

    # Favorite count
    from models.db_models import UserFavorite
    favorite_count = db.query(func.count(UserFavorite.id)).filter(
        UserFavorite.user_id == current_user.id
    ).scalar() or 0

    # Average completion rate
    completed_count = db.query(func.count(ListeningHistory.id)).filter(
        and_(
            ListeningHistory.user_id == current_user.id,
            ListeningHistory.completed == True
        )
    ).scalar() or 0
    avg_completion_rate = (completed_count / total_plays * 100) if total_plays > 0 else 0

    # Top artist (most played)
    top_artist_result = db.query(
        Track.artist,
        func.count(ListeningHistory.id).label('count')
    ).join(
        Track, ListeningHistory.track_id == Track.id
    ).filter(
        ListeningHistory.user_id == current_user.id
    ).group_by(
        Track.artist
    ).order_by(
        desc('count')
    ).first()

    top_artist = top_artist_result[0] if top_artist_result else None

    # Top genre
    top_genre_result = db.query(
        Track.genre,
        func.count(ListeningHistory.id).label('count')
    ).join(
        Track, ListeningHistory.track_id == Track.id
    ).filter(
        and_(
            ListeningHistory.user_id == current_user.id,
            Track.genre.isnot(None)
        )
    ).group_by(
        Track.genre
    ).order_by(
        desc('count')
    ).first()

    top_genre = top_genre_result[0] if top_genre_result else None

    # Listening streak (consecutive days with plays)
    # Simple version: check if played yesterday and today
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    played_today = db.query(ListeningHistory).filter(
        and_(
            ListeningHistory.user_id == current_user.id,
            func.date(ListeningHistory.played_at) == today
        )
    ).first() is not None

    played_yesterday = db.query(ListeningHistory).filter(
        and_(
            ListeningHistory.user_id == current_user.id,
            func.date(ListeningHistory.played_at) == yesterday
        )
    ).first() is not None

    listening_streak_days = 1 if played_today else 0
    if played_today and played_yesterday:
        listening_streak_days = 2  # Simplified - could be extended

    return UserStatsResponse(
        total_plays=total_plays,
        total_listening_time=total_listening_time,
        unique_tracks=unique_tracks,
        favorite_count=favorite_count,
        average_completion_rate=avg_completion_rate,
        top_artist=top_artist,
        top_genre=top_genre,
        listening_streak_days=listening_streak_days,
        member_since=current_user.created_at
    )


@router.get("/top-tracks", response_model=List[TopTrackResponse])
async def get_top_tracks(
    limit: int = 10,
    timeframe: str = "all",  # "all", "week", "month", "year"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's most played tracks"""
    # Calculate time filter
    time_filter = None
    if timeframe == "week":
        time_filter = datetime.utcnow() - timedelta(days=7)
    elif timeframe == "month":
        time_filter = datetime.utcnow() - timedelta(days=30)
    elif timeframe == "year":
        time_filter = datetime.utcnow() - timedelta(days=365)

    # Build query
    query = db.query(
        Track.id,
        Track.title,
        Track.artist,
        Track.album,
        func.count(ListeningHistory.id).label('play_count'),
        func.sum(ListeningHistory.duration_played).label('total_listening_time')
    ).join(
        Track, ListeningHistory.track_id == Track.id
    ).filter(
        ListeningHistory.user_id == current_user.id
    )

    if time_filter:
        query = query.filter(ListeningHistory.played_at >= time_filter)

    top_tracks = query.group_by(
        Track.id, Track.title, Track.artist, Track.album
    ).order_by(
        desc('play_count')
    ).limit(limit).all()

    result = []
    for track in top_tracks:
        result.append(TopTrackResponse(
            track_id=track.id,
            title=track.title,
            artist=track.artist,
            album=track.album,
            play_count=track.play_count,
            total_listening_time=track.total_listening_time or 0
        ))

    return result


# Rating Endpoints
@router.post("/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a track"""
    # Validate rating
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )

    # Verify track exists
    track = db.query(Track).filter(Track.id == rating_data.track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    # Check if rating already exists
    existing_rating = db.query(TrackRating).filter(
        and_(
            TrackRating.user_id == current_user.id,
            TrackRating.track_id == rating_data.track_id
        )
    ).first()

    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this track. Use PUT to update."
        )

    # Create new rating
    new_rating = TrackRating(
        user_id=current_user.id,
        track_id=rating_data.track_id,
        rating=rating_data.rating,
        review=rating_data.review
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return RatingResponse(
        id=new_rating.id,
        track_id=track.id,
        track_title=track.title,
        track_artist=track.artist,
        rating=new_rating.rating,
        review=new_rating.review,
        created_at=new_rating.created_at,
        updated_at=new_rating.updated_at
    )


@router.put("/ratings/{track_id}", response_model=RatingResponse)
async def update_rating(
    track_id: int,
    rating_data: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a track rating"""
    # Validate rating
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )

    # Find existing rating
    rating = db.query(TrackRating).filter(
        and_(
            TrackRating.user_id == current_user.id,
            TrackRating.track_id == track_id
        )
    ).first()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found. Use POST to create a new rating."
        )

    # Update rating
    rating.rating = rating_data.rating
    rating.review = rating_data.review
    rating.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rating)

    # Get track info
    track = db.query(Track).filter(Track.id == track_id).first()

    return RatingResponse(
        id=rating.id,
        track_id=track.id,
        track_title=track.title,
        track_artist=track.artist,
        rating=rating.rating,
        review=rating.review,
        created_at=rating.created_at,
        updated_at=rating.updated_at
    )


@router.delete("/ratings/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rating(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a track rating"""
    rating = db.query(TrackRating).filter(
        and_(
            TrackRating.user_id == current_user.id,
            TrackRating.track_id == track_id
        )
    ).first()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )

    db.delete(rating)
    db.commit()

    return None


@router.get("/ratings", response_model=List[RatingResponse])
async def get_user_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all of user's ratings"""
    ratings = db.query(TrackRating, Track).join(
        Track, TrackRating.track_id == Track.id
    ).filter(
        TrackRating.user_id == current_user.id
    ).order_by(
        desc(TrackRating.updated_at)
    ).all()

    result = []
    for rating, track in ratings:
        result.append(RatingResponse(
            id=rating.id,
            track_id=track.id,
            track_title=track.title,
            track_artist=track.artist,
            rating=rating.rating,
            review=rating.review,
            created_at=rating.created_at,
            updated_at=rating.updated_at
        ))

    return result


@router.get("/ratings/{track_id}", response_model=RatingResponse)
async def get_track_rating(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's rating for a specific track"""
    rating = db.query(TrackRating, Track).join(
        Track, TrackRating.track_id == Track.id
    ).filter(
        and_(
            TrackRating.user_id == current_user.id,
            TrackRating.track_id == track_id
        )
    ).first()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )

    rating_obj, track = rating

    return RatingResponse(
        id=rating_obj.id,
        track_id=track.id,
        track_title=track.title,
        track_artist=track.artist,
        rating=rating_obj.rating,
        review=rating_obj.review,
        created_at=rating_obj.created_at,
        updated_at=rating_obj.updated_at
    )

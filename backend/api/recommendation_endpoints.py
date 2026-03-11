"""
Recommendation API endpoints: personalized recommendations, similar tracks
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from models.db_models import Track, TrackSimilarity, User
from utils.database import get_db
from utils.auth import get_current_user
from utils.recommendations import (
    get_collaborative_recommendations,
    get_content_based_recommendations,
    get_recommendations_for_user
)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


# Response models
class TrackRecommendationResponse(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: Optional[int]
    thumbnail_url: Optional[str]
    genre: Optional[str]
    mood: Optional[str]
    play_count: int
    recommendation_score: Optional[float] = None

    class Config:
        from_attributes = True


class SimilarTrackResponse(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: Optional[int]
    thumbnail_url: Optional[str]
    genre: Optional[str]
    mood: Optional[str]
    play_count: int
    similarity_score: float

    class Config:
        from_attributes = True


@router.get("/for-you", response_model=List[TrackRecommendationResponse])
async def get_personalized_recommendations(
    limit: int = Query(50, ge=1, le=200, description="Max recommendations to return"),
    algorithm: str = Query("hybrid", regex="^(hybrid|collaborative|content)$",
                          description="Recommendation algorithm to use"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations for the current user

    Uses hybrid approach combining:
    - Collaborative filtering (based on similar users)
    - Content-based filtering (based on user's favorites)

    **Algorithms:**
    - `hybrid`: Combines collaborative and content-based (default)
    - `collaborative`: Only uses similar users' listening history
    - `content`: Only uses track metadata (genre, mood, artist)

    Returns empty list for new users with no listening history
    """
    if algorithm == "collaborative":
        tracks = get_collaborative_recommendations(current_user.id, db, limit)
    elif algorithm == "content":
        tracks = get_recommendations_for_user(
            current_user.id, db, limit,
            use_collaborative=False, use_content=True
        )
    else:  # hybrid
        tracks = get_recommendations_for_user(current_user.id, db, limit)

    return tracks


@router.get("/similar-tracks/{track_id}", response_model=List[SimilarTrackResponse])
async def get_similar_tracks(
    track_id: int,
    limit: int = Query(20, ge=1, le=100, description="Max similar tracks to return"),
    algorithm: str = Query("hybrid", regex="^(hybrid|collaborative|content)$",
                          description="Similarity algorithm"),
    db: Session = Depends(get_db)
):
    """
    Get tracks similar to the specified track

    **Algorithms:**
    - `hybrid`: Uses precomputed similarities (collaborative + content)
    - `collaborative`: Based on user listening patterns (co-occurrence)
    - `content`: Based on track metadata (genre, mood, artist)

    If `hybrid` is selected but no precomputed similarities exist,
    falls back to content-based recommendations
    """
    # Check if track exists
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    if algorithm == "collaborative":
        # Get tracks frequently played by same users
        from utils.recommendations import compute_track_similarity

        similar_track_scores = compute_track_similarity(track_id, db)
        if not similar_track_scores:
            # Fallback to content-based
            tracks = get_content_based_recommendations(track_id, db, limit)
            return [{"similarity_score": 0.5, **track.__dict__} for track in tracks]

        # Get track objects
        track_ids = [t[0] for t in similar_track_scores[:limit]]
        tracks = db.query(Track).filter(Track.id.in_(track_ids)).all()

        # Create score map
        score_map = {t[0]: t[1] for t in similar_track_scores}

        # Return with scores
        results = []
        for t in tracks:
            results.append({
                "id": t.id,
                "title": t.title,
                "artist": t.artist,
                "album": t.album,
                "duration": t.duration,
                "thumbnail_url": t.thumbnail_url,
                "genre": t.genre,
                "mood": t.mood,
                "play_count": t.play_count,
                "similarity_score": score_map.get(t.id, 0.0)
            })

        return results

    elif algorithm == "content":
        # Get tracks with similar metadata
        tracks = get_content_based_recommendations(track_id, db, limit)
        return [{"similarity_score": 0.8, **track.__dict__} for track in tracks]

    else:  # hybrid (use precomputed similarities)
        # Query TrackSimilarity table
        similar = db.query(Track, TrackSimilarity.similarity_score).join(
            TrackSimilarity, Track.id == TrackSimilarity.track_id_2
        ).filter(
            TrackSimilarity.track_id_1 == track_id,
            TrackSimilarity.algorithm == "hybrid"
        ).order_by(
            TrackSimilarity.similarity_score.desc()
        ).limit(limit).all()

        if not similar:
            # Fallback to content-based if no precomputed similarities
            tracks = get_content_based_recommendations(track_id, db, limit)
            return [{"similarity_score": 0.7, **track.__dict__} for track in tracks]

        # Return with precomputed scores
        results = []
        for track_obj, score in similar:
            results.append({
                "id": track_obj.id,
                "title": track_obj.title,
                "artist": track_obj.artist,
                "album": track_obj.album,
                "duration": track_obj.duration,
                "thumbnail_url": track_obj.thumbnail_url,
                "genre": track_obj.genre,
                "mood": track_obj.mood,
                "play_count": track_obj.play_count,
                "similarity_score": score
            })

        return results


@router.get("/daily-mix", response_model=List[TrackRecommendationResponse])
async def get_daily_mix(
    limit: int = Query(50, ge=1, le=100, description="Tracks in the mix"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a "Daily Mix" playlist tailored to user's taste

    Combines user's favorite tracks with recommendations
    """
    from models.db_models import UserFavorite, ListeningHistory
    from sqlalchemy import func
    from datetime import datetime, timedelta

    # Get user's top tracks from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_top_tracks = db.query(
        Track,
        func.count(ListeningHistory.id).label('play_count')
    ).join(
        ListeningHistory, Track.id == ListeningHistory.track_id
    ).filter(
        ListeningHistory.user_id == current_user.id,
        ListeningHistory.played_at >= thirty_days_ago
    ).group_by(Track.id).order_by(
        func.count(ListeningHistory.id).desc()
    ).limit(limit // 2).all()

    # Get recommendations for remaining slots
    recommendations = get_recommendations_for_user(
        current_user.id, db,
        limit=limit - len(recent_top_tracks)
    )

    # Combine and shuffle
    mix_tracks = [t[0] for t in recent_top_tracks] + recommendations

    # Remove duplicates
    seen = set()
    unique_mix = []
    for track in mix_tracks:
        if track.id not in seen:
            seen.add(track.id)
            unique_mix.append(track)

    return unique_mix[:limit]


@router.get("/discover-weekly", response_model=List[TrackRecommendationResponse])
async def get_discover_weekly(
    limit: int = Query(30, ge=1, le=100, description="Tracks in discover weekly"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a "Discover Weekly" playlist with fresh recommendations

    Focuses on tracks the user hasn't heard yet
    """
    from models.db_models import ListeningHistory

    # Get tracks user has already played
    played_tracks = set([
        row[0] for row in db.query(ListeningHistory.track_id).filter(
            ListeningHistory.user_id == current_user.id
        ).all()
    ])

    # Get recommendations
    all_recommendations = get_recommendations_for_user(current_user.id, db, limit=limit * 2)

    # Filter out already played tracks
    fresh_recommendations = [
        track for track in all_recommendations
        if track.id not in played_tracks
    ]

    return fresh_recommendations[:limit]


@router.get("/because-you-liked/{track_id}", response_model=List[SimilarTrackResponse])
async def get_because_you_liked(
    track_id: int,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get recommendations "Because you liked [track name]"

    Similar to similar-tracks but formatted for UI display
    """
    # Check if track exists
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    # Get similar tracks using hybrid approach
    similar = db.query(Track, TrackSimilarity.similarity_score).join(
        TrackSimilarity, Track.id == TrackSimilarity.track_id_2
    ).filter(
        TrackSimilarity.track_id_1 == track_id
    ).order_by(
        TrackSimilarity.similarity_score.desc()
    ).limit(limit).all()

    if not similar:
        # Fallback to content-based
        tracks = get_content_based_recommendations(track_id, db, limit)
        return [{"similarity_score": 0.7, **t.__dict__} for t in tracks]

    results = []
    for track_obj, score in similar:
        results.append({
            "id": track_obj.id,
            "title": track_obj.title,
            "artist": track_obj.artist,
            "album": track_obj.album,
            "duration": track_obj.duration,
            "thumbnail_url": track_obj.thumbnail_url,
            "genre": track_obj.genre,
            "mood": track_obj.mood,
            "play_count": track_obj.play_count,
            "similarity_score": score
        })

    return results

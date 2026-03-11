"""
Recommendation engine using collaborative filtering and content-based algorithms
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from models.db_models import ListeningHistory, UserFavorite, Track, TrackSimilarity, User
from typing import List, Dict, Tuple
from datetime import datetime
import math


def compute_user_similarity(user_id: int, other_user_id: int, db: Session) -> float:
    """
    Compute Jaccard similarity between two users based on listening history

    Returns value between 0.0 (no common tracks) and 1.0 (identical listening history)
    """
    # Get tracks both users have played
    user_tracks = set([
        row[0] for row in db.query(ListeningHistory.track_id).filter(
            ListeningHistory.user_id == user_id
        ).all()
    ])

    other_tracks = set([
        row[0] for row in db.query(ListeningHistory.track_id).filter(
            ListeningHistory.user_id == other_user_id
        ).all()
    ])

    if not user_tracks or not other_tracks:
        return 0.0

    common_tracks = user_tracks.intersection(other_tracks)

    if not common_tracks:
        return 0.0

    # Jaccard similarity: intersection / union
    union = user_tracks.union(other_tracks)
    return len(common_tracks) / len(union)


def get_collaborative_recommendations(
    user_id: int,
    db: Session,
    limit: int = 20,
    min_similarity: float = 0.1
) -> List[Track]:
    """
    Get recommendations based on similar users (collaborative filtering)

    Algorithm:
    1. Find users with similar listening history
    2. Get tracks those users played that current user hasn't
    3. Weight by similarity score and play count
    4. Return top tracks

    Args:
        user_id: User to generate recommendations for
        db: Database session
        limit: Max number of recommendations
        min_similarity: Minimum similarity threshold for considering users

    Returns:
        List of recommended Track objects
    """
    # Get user's listening history
    user_tracks = set([
        row[0] for row in db.query(ListeningHistory.track_id).filter(
            ListeningHistory.user_id == user_id
        ).all()
    ])

    if not user_tracks:
        # New user - return popular tracks
        return db.query(Track).order_by(Track.play_count.desc()).limit(limit).all()

    # Find similar users (users who played same tracks)
    similar_users = db.query(
        ListeningHistory.user_id,
        func.count(ListeningHistory.track_id).label('common_count')
    ).filter(
        ListeningHistory.track_id.in_(user_tracks),
        ListeningHistory.user_id != user_id
    ).group_by(
        ListeningHistory.user_id
    ).order_by(
        func.count(ListeningHistory.track_id).desc()
    ).limit(20).all()

    if not similar_users:
        # No similar users - return popular tracks
        return db.query(Track).order_by(Track.play_count.desc()).limit(limit).all()

    # Get tracks played by similar users that current user hasn't played
    similar_user_ids = [u[0] for u in similar_users]

    recommended_tracks = db.query(
        Track,
        func.count(ListeningHistory.id).label('recommendation_score')
    ).join(
        ListeningHistory, Track.id == ListeningHistory.track_id
    ).filter(
        ListeningHistory.user_id.in_(similar_user_ids),
        ~Track.id.in_(user_tracks)
    ).group_by(
        Track.id
    ).order_by(
        func.count(ListeningHistory.id).desc(),
        Track.play_count.desc()
    ).limit(limit).all()

    return [t[0] for t in recommended_tracks]


def get_content_based_recommendations(
    track_id: int,
    db: Session,
    limit: int = 20
) -> List[Track]:
    """
    Get tracks similar to given track based on metadata (genre, mood, artist)

    Args:
        track_id: Track to find similar tracks for
        db: Database session
        limit: Max number of recommendations

    Returns:
        List of similar Track objects
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        return []

    # Priority 1: Same genre and mood
    similar_tracks = db.query(Track).filter(
        Track.id != track_id,
        Track.genre == track.genre,
        Track.mood == track.mood
    ).order_by(Track.play_count.desc()).limit(limit).all()

    if len(similar_tracks) >= limit:
        return similar_tracks

    # Priority 2: Same genre
    if track.genre:
        genre_tracks = db.query(Track).filter(
            Track.id != track_id,
            Track.genre == track.genre,
            ~Track.id.in_([t.id for t in similar_tracks])
        ).order_by(Track.play_count.desc()).limit(limit - len(similar_tracks)).all()
        similar_tracks.extend(genre_tracks)

    if len(similar_tracks) >= limit:
        return similar_tracks[:limit]

    # Priority 3: Same mood
    if track.mood:
        mood_tracks = db.query(Track).filter(
            Track.id != track_id,
            Track.mood == track.mood,
            ~Track.id.in_([t.id for t in similar_tracks])
        ).order_by(Track.play_count.desc()).limit(limit - len(similar_tracks)).all()
        similar_tracks.extend(mood_tracks)

    if len(similar_tracks) >= limit:
        return similar_tracks[:limit]

    # Priority 4: Same artist
    if track.artist:
        artist_tracks = db.query(Track).filter(
            Track.id != track_id,
            Track.artist == track.artist,
            ~Track.id.in_([t.id for t in similar_tracks])
        ).order_by(Track.play_count.desc()).limit(limit - len(similar_tracks)).all()
        similar_tracks.extend(artist_tracks)

    return similar_tracks[:limit]


def compute_track_similarity(track_id: int, db: Session) -> List[Tuple[int, float]]:
    """
    Compute similar tracks based on co-occurrence in listening history

    Tracks that are frequently played by the same users are considered similar

    Args:
        track_id: Track to find similar tracks for
        db: Database session

    Returns:
        List of (track_id, similarity_score) tuples sorted by score descending
    """
    # Get users who played this track
    users_who_played = db.query(ListeningHistory.user_id).filter(
        ListeningHistory.track_id == track_id
    ).distinct().all()

    if not users_who_played:
        return []

    user_ids = [u[0] for u in users_who_played]
    total_users = len(user_ids)

    # Get other tracks these users played
    similar_tracks = db.query(
        ListeningHistory.track_id,
        func.count(ListeningHistory.user_id.distinct()).label('co_occurrence')
    ).filter(
        ListeningHistory.user_id.in_(user_ids),
        ListeningHistory.track_id != track_id
    ).group_by(
        ListeningHistory.track_id
    ).order_by(
        func.count(ListeningHistory.user_id.distinct()).desc()
    ).limit(50).all()

    # Calculate similarity score (co-occurrence / total_users)
    results = [
        (track_id_result, co_occurrence / total_users)
        for track_id_result, co_occurrence in similar_tracks
    ]

    return results


def precompute_track_similarities(db: Session, batch_size: int = 100):
    """
    Background job to precompute TrackSimilarity table

    This is an expensive operation and should be run periodically (e.g., daily)

    Args:
        db: Database session
        batch_size: Number of tracks to process in each batch
    """
    from datetime import datetime

    all_tracks = db.query(Track).order_by(Track.play_count.desc()).all()
    total_tracks = len(all_tracks)

    print(f"Computing similarities for {total_tracks} tracks...")

    for i, track in enumerate(all_tracks):
        if i % 10 == 0:
            print(f"Progress: {i}/{total_tracks} ({i*100//total_tracks}%)")

        # Compute collaborative filtering similarities
        similar_track_scores = compute_track_similarity(track.id, db)

        # Also get content-based similarities
        content_similar = get_content_based_recommendations(track.id, db, limit=20)

        # Combine both approaches
        similarity_dict = {}

        # Add collaborative filtering results (higher weight)
        for similar_id, score in similar_track_scores[:20]:
            similarity_dict[similar_id] = score * 0.7  # 70% weight

        # Add content-based results (lower weight)
        for j, similar_track in enumerate(content_similar[:20]):
            content_score = 1.0 - (j * 0.05)  # Decreasing score
            if similar_track.id in similarity_dict:
                similarity_dict[similar_track.id] += content_score * 0.3  # 30% weight
            else:
                similarity_dict[similar_track.id] = content_score * 0.3

        # Sort by combined score
        sorted_similar = sorted(
            similarity_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]

        # Update database
        for similar_id, score in sorted_similar:
            # Check if similarity already exists
            existing = db.query(TrackSimilarity).filter(
                TrackSimilarity.track_id_1 == track.id,
                TrackSimilarity.track_id_2 == similar_id,
                TrackSimilarity.algorithm == "hybrid"
            ).first()

            if existing:
                existing.similarity_score = score
                existing.computed_at = datetime.utcnow()
            else:
                similarity = TrackSimilarity(
                    track_id_1=track.id,
                    track_id_2=similar_id,
                    similarity_score=score,
                    algorithm="hybrid"
                )
                db.add(similarity)

        # Commit every batch_size tracks
        if (i + 1) % batch_size == 0:
            db.commit()
            print(f"Committed batch at {i+1} tracks")

    # Final commit
    db.commit()
    print(f"✓ Similarity computation complete for {total_tracks} tracks")


def get_recommendations_for_user(
    user_id: int,
    db: Session,
    limit: int = 50,
    use_collaborative: bool = True,
    use_content: bool = True
) -> List[Track]:
    """
    Get hybrid recommendations combining collaborative and content-based filtering

    Args:
        user_id: User to generate recommendations for
        db: Database session
        limit: Max number of recommendations
        use_collaborative: Whether to use collaborative filtering
        use_content: Whether to use content-based filtering

    Returns:
        List of recommended Track objects
    """
    recommendations = []

    if use_collaborative:
        # Get collaborative recommendations
        collab_recs = get_collaborative_recommendations(user_id, db, limit=limit)
        recommendations.extend(collab_recs)

    if use_content and len(recommendations) < limit:
        # Get user's recent favorites for content-based recommendations
        recent_favorites = db.query(UserFavorite.track_id).filter(
            UserFavorite.user_id == user_id
        ).order_by(UserFavorite.favorited_at.desc()).limit(5).all()

        if recent_favorites:
            fav_track_ids = [f[0] for f in recent_favorites]
            existing_ids = set([t.id for t in recommendations])

            # Get content-based recommendations for each favorite
            for fav_id in fav_track_ids:
                content_recs = get_content_based_recommendations(
                    fav_id, db, limit=(limit - len(recommendations)) // len(fav_track_ids) + 1
                )
                for track in content_recs:
                    if track.id not in existing_ids and len(recommendations) < limit:
                        recommendations.append(track)
                        existing_ids.add(track.id)

    # Remove duplicates while preserving order
    seen = set()
    unique_recommendations = []
    for track in recommendations:
        if track.id not in seen:
            seen.add(track.id)
            unique_recommendations.append(track)

    return unique_recommendations[:limit]

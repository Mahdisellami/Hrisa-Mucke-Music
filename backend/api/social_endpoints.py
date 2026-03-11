"""
Social features API endpoints: follow users, activity feed, profiles, sharing
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from models.db_models import User, UserFollow, ActivityFeed, Track, Playlist, ListeningHistory
from utils.database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/api/social", tags=["Social"])


# Response models
class UserProfileResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    created_at: datetime
    is_admin: bool

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    playlists: int
    followers: int
    following: int
    total_plays: int


class PublicProfileResponse(BaseModel):
    user: UserProfileResponse
    stats: UserStatsResponse


class ActivityResponse(BaseModel):
    id: int
    user_id: int
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    activity_type: str
    created_at: datetime
    track_id: Optional[int]
    track_title: Optional[str]
    track_artist: Optional[str]
    playlist_id: Optional[int]
    playlist_name: Optional[str]
    target_user_id: Optional[int]
    target_username: Optional[str]
    activity_metadata: Optional[str]

    class Config:
        from_attributes = True


class FollowStatusResponse(BaseModel):
    is_following: bool


class MessageResponse(BaseModel):
    message: str


# User Following Endpoints
@router.post("/follow/{user_id}", response_model=MessageResponse)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Follow a user

    Creates a follow relationship and adds activity to feed
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )

    # Check if target user exists
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already following
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user.id,
        UserFollow.following_id == user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user"
        )

    # Create follow relationship
    follow = UserFollow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)

    # Create activity feed entry
    activity = ActivityFeed(
        user_id=current_user.id,
        activity_type="followed_user",
        target_user_id=user_id
    )
    db.add(activity)
    db.commit()

    return {"message": "Followed successfully"}


@router.delete("/unfollow/{user_id}", response_model=MessageResponse)
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unfollow a user

    Removes follow relationship
    """
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user.id,
        UserFollow.following_id == user_id
    ).first()

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not following this user"
        )

    db.delete(follow)
    db.commit()
    return {"message": "Unfollowed successfully"}


@router.get("/followers/{user_id}", response_model=List[UserProfileResponse])
async def get_followers(user_id: int, db: Session = Depends(get_db)):
    """
    Get user's followers

    Returns list of users who follow the specified user
    """
    followers = db.query(User).join(
        UserFollow, User.id == UserFollow.follower_id
    ).filter(UserFollow.following_id == user_id).all()

    return followers


@router.get("/following/{user_id}", response_model=List[UserProfileResponse])
async def get_following(user_id: int, db: Session = Depends(get_db)):
    """
    Get users that specified user is following

    Returns list of users the specified user follows
    """
    following = db.query(User).join(
        UserFollow, User.id == UserFollow.following_id
    ).filter(UserFollow.follower_id == user_id).all()

    return following


@router.get("/is-following/{user_id}", response_model=FollowStatusResponse)
async def is_following(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if current user follows target user
    """
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user.id,
        UserFollow.following_id == user_id
    ).first()

    return {"is_following": follow is not None}


# Activity Feed Endpoints
@router.get("/feed", response_model=List[ActivityResponse])
async def get_activity_feed(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get activity feed from followed users

    Returns recent activities from users the current user follows
    """
    # Get IDs of users current user follows
    following_ids_query = db.query(UserFollow.following_id).filter(
        UserFollow.follower_id == current_user.id
    )
    following_ids = [row[0] for row in following_ids_query.all()]

    # Get activities from followed users
    activities = db.query(ActivityFeed).filter(
        ActivityFeed.user_id.in_(following_ids)
    ).order_by(ActivityFeed.created_at.desc()).offset(offset).limit(limit).all()

    # Enrich activities with user, track, and playlist data
    results = []
    for activity in activities:
        user = db.query(User).filter(User.id == activity.user_id).first()

        track_title = None
        track_artist = None
        if activity.track_id:
            track = db.query(Track).filter(Track.id == activity.track_id).first()
            if track:
                track_title = track.title
                track_artist = track.artist

        playlist_name = None
        if activity.playlist_id:
            playlist = db.query(Playlist).filter(Playlist.id == activity.playlist_id).first()
            if playlist:
                playlist_name = playlist.name

        target_username = None
        if activity.target_user_id:
            target_user = db.query(User).filter(User.id == activity.target_user_id).first()
            if target_user:
                target_username = target_user.username

        results.append({
            "id": activity.id,
            "user_id": activity.user_id,
            "username": user.username if user else "Unknown",
            "display_name": user.display_name if user else None,
            "avatar_url": user.avatar_url if user else None,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
            "track_id": activity.track_id,
            "track_title": track_title,
            "track_artist": track_artist,
            "playlist_id": activity.playlist_id,
            "playlist_name": playlist_name,
            "target_user_id": activity.target_user_id,
            "target_username": target_username,
            "activity_metadata": activity.activity_metadata
        })

    return results


@router.get("/activity/{user_id}", response_model=List[ActivityResponse])
async def get_user_activity(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get public activity for specific user

    Returns recent public activities for the specified user
    """
    activities = db.query(ActivityFeed).filter(
        ActivityFeed.user_id == user_id
    ).order_by(ActivityFeed.created_at.desc()).limit(limit).all()

    # Enrich activities
    results = []
    user = db.query(User).filter(User.id == user_id).first()

    for activity in activities:
        track_title = None
        track_artist = None
        if activity.track_id:
            track = db.query(Track).filter(Track.id == activity.track_id).first()
            if track:
                track_title = track.title
                track_artist = track.artist

        playlist_name = None
        if activity.playlist_id:
            playlist = db.query(Playlist).filter(Playlist.id == activity.playlist_id).first()
            if playlist:
                playlist_name = playlist.name

        target_username = None
        if activity.target_user_id:
            target_user = db.query(User).filter(User.id == activity.target_user_id).first()
            if target_user:
                target_username = target_user.username

        results.append({
            "id": activity.id,
            "user_id": activity.user_id,
            "username": user.username if user else "Unknown",
            "display_name": user.display_name if user else None,
            "avatar_url": user.avatar_url if user else None,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
            "track_id": activity.track_id,
            "track_title": track_title,
            "track_artist": track_artist,
            "playlist_id": activity.playlist_id,
            "playlist_name": playlist_name,
            "target_user_id": activity.target_user_id,
            "target_username": target_username,
            "activity_metadata": activity.activity_metadata
        })

    return results


# User Profile Endpoints
@router.get("/profile/{user_id}", response_model=PublicProfileResponse)
async def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Get public profile data

    Returns user profile with statistics (playlists, followers, plays)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get stats
    playlist_count = db.query(Playlist).filter(
        Playlist.owner_id == user_id,
        Playlist.is_public == True
    ).count()

    follower_count = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).count()

    following_count = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).count()

    total_plays = db.query(ListeningHistory).filter(
        ListeningHistory.user_id == user_id
    ).count()

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "created_at": user.created_at,
            "is_admin": user.is_admin
        },
        "stats": {
            "playlists": playlist_count,
            "followers": follower_count,
            "following": following_count,
            "total_plays": total_plays
        }
    }


# Sharing Endpoints
@router.post("/share/playlist/{playlist_id}", response_model=dict)
async def share_playlist(
    playlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Share a playlist

    Makes playlist public and creates activity feed entry
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )

    # Verify ownership
    if playlist.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to share this playlist"
        )

    # Make playlist public
    playlist.is_public = True
    db.commit()

    # Create activity
    activity = ActivityFeed(
        user_id=current_user.id,
        activity_type="shared_playlist",
        playlist_id=playlist_id
    )
    db.add(activity)
    db.commit()

    return {
        "share_url": f"/playlist/{playlist_id}",
        "message": "Playlist shared successfully"
    }


@router.post("/share/track/{track_id}", response_model=MessageResponse)
async def share_track(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Share a track to activity feed

    Creates activity feed entry for track share
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    activity = ActivityFeed(
        user_id=current_user.id,
        activity_type="shared_track",
        track_id=track_id
    )
    db.add(activity)
    db.commit()

    return {"message": "Track shared to feed successfully"}

"""
SQLAlchemy database models for multi-user Music Tool
Supports: Users, Tracks, Playlists, Favorites, Listening History, Social Features
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User accounts with authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(500))
    bio = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_admin = Column(Boolean, default=False)

    # Relationships
    playlists = relationship("Playlist", back_populates="owner", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    listening_history = relationship("ListeningHistory", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("TrackRating", back_populates="user", cascade="all, delete-orphan")
    followers = relationship("UserFollow", foreign_keys="UserFollow.following_id", back_populates="following_user")
    following = relationship("UserFollow", foreign_keys="UserFollow.follower_id", back_populates="follower_user")
    activities = relationship("ActivityFeed", back_populates="user", cascade="all, delete-orphan")
    collaborative_playlists = relationship("PlaylistCollaborator", back_populates="user", cascade="all, delete-orphan")


class Track(Base):
    """Music tracks with YouTube source and metadata"""
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False, index=True)
    artist = Column(String(200), nullable=False, index=True)
    album = Column(String(200), index=True)

    # YouTube source
    youtube_url = Column(String(500), unique=True, nullable=False, index=True)
    youtube_video_id = Column(String(50), index=True)
    thumbnail_url = Column(String(500))

    # File storage
    file_path = Column(String(500), nullable=False)  # e.g., data/music/numb.mp3
    file_size = Column(Integer)  # bytes
    duration = Column(Integer)  # seconds

    # Metadata for discovery
    genre = Column(String(100), index=True)
    mood = Column(String(100), index=True)  # e.g., "energetic", "calm", "sad"
    language = Column(String(50))
    lyrics_path = Column(String(500))  # Path to .lrc or .txt file (without extension)

    # Stats (for recommendations)
    play_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)

    # Checksums (preserve from current system)
    info_checksum = Column(String(32))
    src_checksum = Column(String(32), unique=True, index=True)  # Unique by source URL
    dest_checksum = Column(String(32))
    track_checksum = Column(String(32))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    added_by_user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    added_by = relationship("User")
    playlist_tracks = relationship("PlaylistTrack", back_populates="track", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="track", cascade="all, delete-orphan")
    listening_history = relationship("ListeningHistory", back_populates="track", cascade="all, delete-orphan")
    ratings = relationship("TrackRating", back_populates="track", cascade="all, delete-orphan")


class Playlist(Base):
    """User playlists (personal, collaborative, or system-generated)"""
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    cover_image_url = Column(String(500))

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=True)
    is_collaborative = Column(Boolean, default=False)

    # Metadata
    playlist_type = Column(String(50), default="user")  # "user", "system", "genre", "mood"
    genre = Column(String(100))  # For genre-based playlists
    mood = Column(String(100))   # For mood-based playlists

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="playlists")
    tracks = relationship("PlaylistTrack", back_populates="playlist", order_by="PlaylistTrack.position", cascade="all, delete-orphan")
    collaborators = relationship("PlaylistCollaborator", back_populates="playlist", cascade="all, delete-orphan")


class PlaylistTrack(Base):
    """Association table for playlist tracks (with ordering)"""
    __tablename__ = "playlist_tracks"

    id = Column(Integer, primary_key=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False)  # Order in playlist

    added_at = Column(DateTime, default=datetime.utcnow)
    added_by_user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    playlist = relationship("Playlist", back_populates="tracks")
    track = relationship("Track", back_populates="playlist_tracks")
    added_by = relationship("User")

    __table_args__ = (
        UniqueConstraint('playlist_id', 'track_id', name='unique_playlist_track'),
    )


class PlaylistCollaborator(Base):
    """Collaborative playlist permissions"""
    __tablename__ = "playlist_collaborators"

    id = Column(Integer, primary_key=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    can_edit = Column(Boolean, default=True)  # Can add/remove tracks
    can_invite = Column(Boolean, default=False)  # Can invite others

    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    playlist = relationship("Playlist", back_populates="collaborators")
    user = relationship("User", back_populates="collaborative_playlists")

    __table_args__ = (
        UniqueConstraint('playlist_id', 'user_id', name='unique_collaborator'),
    )


class UserFavorite(Base):
    """User's favorite tracks"""
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)

    favorited_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="favorites")
    track = relationship("Track", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint('user_id', 'track_id', name='unique_user_favorite'),
    )


class ListeningHistory(Base):
    """Track user listening history for recommendations"""
    __tablename__ = "listening_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)

    played_at = Column(DateTime, default=datetime.utcnow, index=True)
    duration_played = Column(Integer)  # seconds actually listened
    completed = Column(Boolean, default=False)  # Did they listen to the end?

    # Context
    source = Column(String(100))  # "playlist", "album", "search", "recommendations", "radio"
    source_id = Column(Integer)  # ID of playlist/album if applicable

    # Relationships
    user = relationship("User", back_populates="listening_history")
    track = relationship("Track", back_populates="listening_history")


class TrackRating(Base):
    """User ratings for tracks"""
    __tablename__ = "track_ratings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)

    rating = Column(Integer, nullable=False)  # 1-5 stars
    review = Column(Text)  # Optional text review

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="ratings")
    track = relationship("Track", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint('user_id', 'track_id', name='unique_user_rating'),
    )


class UserFollow(Base):
    """User follow relationships for social features"""
    __tablename__ = "user_follows"

    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    followed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
    )


class ActivityFeed(Base):
    """Social activity feed for followed users"""
    __tablename__ = "activity_feed"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    activity_type = Column(String(50), nullable=False, index=True)
    # Types: "favorited_track", "created_playlist", "added_to_playlist",
    #        "followed_user", "shared_playlist", "top_listener"

    # Polymorphic data
    track_id = Column(Integer, ForeignKey("tracks.id"))
    playlist_id = Column(Integer, ForeignKey("playlists.id"))
    target_user_id = Column(Integer, ForeignKey("users.id"))

    metadata = Column(Text)  # JSON string for flexible data

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="activities")
    track = relationship("Track")
    playlist = relationship("Playlist")
    target_user = relationship("User", foreign_keys=[target_user_id])


class TrackSimilarity(Base):
    """Precomputed similarity scores between tracks for recommendations"""
    __tablename__ = "track_similarity"

    id = Column(Integer, primary_key=True)
    track_id_1 = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)
    track_id_2 = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)

    similarity_score = Column(Float, nullable=False)  # 0.0 to 1.0
    algorithm = Column(String(50))  # "collaborative", "content_based", "hybrid"

    computed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('track_id_1', 'track_id_2', 'algorithm', name='unique_similarity'),
    )

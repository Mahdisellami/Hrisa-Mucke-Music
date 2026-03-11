#!/usr/bin/env python3
"""
Seed Test Data Script

Creates sample users, tracks, playlists, and social data for testing.
Useful for development and demo purposes.
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from models.db_models import (
    User, Track, Playlist, PlaylistTrack, UserFavorite,
    ListeningHistory, TrackRating, UserFollow, ActivityFeed
)
from utils.database import SessionLocal
from utils.auth import get_password_hash


# Sample Data
SAMPLE_USERS = [
    {'username': 'alice', 'email': 'alice@example.com', 'display_name': 'Alice Johnson', 'bio': 'Music lover 🎵'},
    {'username': 'bob', 'email': 'bob@example.com', 'display_name': 'Bob Smith', 'bio': 'Rock enthusiast'},
    {'username': 'charlie', 'email': 'charlie@example.com', 'display_name': 'Charlie Brown', 'bio': 'Jazz aficionado'},
    {'username': 'diana', 'email': 'diana@example.com', 'display_name': 'Diana Prince', 'bio': 'Electronic music producer'},
    {'username': 'eve', 'email': 'eve@example.com', 'display_name': 'Eve Martinez', 'bio': 'Hip-hop head'},
]

SAMPLE_TRACKS = [
    {'title': 'Summer Vibes', 'artist': 'The Sunshine Band', 'album': 'Feel Good', 'genre': 'pop', 'mood': 'happy', 'duration': 210},
    {'title': 'Midnight Blues', 'artist': 'Blues Brothers', 'album': 'Late Night', 'genre': 'blues', 'mood': 'sad', 'duration': 245},
    {'title': 'Electric Dreams', 'artist': 'Synth Masters', 'album': 'Digital World', 'genre': 'electronic', 'mood': 'energetic', 'duration': 198},
    {'title': 'Mountain High', 'artist': 'The Climbers', 'album': 'Peak Experience', 'genre': 'rock', 'mood': 'motivational', 'duration': 267},
    {'title': 'Love Letter', 'artist': 'Romance Quartet', 'album': 'Hearts United', 'genre': 'pop', 'mood': 'romantic', 'duration': 189},
    {'title': 'City Lights', 'artist': 'Urban Poets', 'album': 'Concrete Jungle', 'genre': 'hip-hop', 'mood': 'chill', 'duration': 223},
    {'title': 'Rainy Day', 'artist': 'Melancholy Souls', 'album': 'Gray Skies', 'genre': 'folk', 'mood': 'sad', 'duration': 256},
    {'title': 'Dance Floor', 'artist': 'Party Starters', 'album': 'All Night Long', 'genre': 'electronic', 'mood': 'energetic', 'duration': 201},
    {'title': 'Sunset Drive', 'artist': 'Highway Band', 'album': 'Open Road', 'genre': 'rock', 'mood': 'nostalgic', 'duration': 234},
    {'title': 'Morning Coffee', 'artist': 'Acoustic Duo', 'album': 'Simple Pleasures', 'genre': 'folk', 'mood': 'chill', 'duration': 178},
]

SAMPLE_PLAYLISTS = [
    {'name': 'Workout Mix', 'description': 'High energy tracks to power through your workout'},
    {'name': 'Study Focus', 'description': 'Chill beats for concentration'},
    {'name': 'Road Trip', 'description': 'Perfect songs for long drives'},
    {'name': 'Rainy Day', 'description': 'Cozy tracks for staying indoors'},
    {'name': 'Party Anthems', 'description': 'Get the party started!'},
]


def seed_users(db: Session) -> list[User]:
    """Create sample users."""
    print("Creating users...")
    users = []

    for user_data in SAMPLE_USERS:
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            hashed_password=get_password_hash('password123'),  # Default password
            display_name=user_data['display_name'],
            bio=user_data['bio'],
        )
        db.add(user)
        users.append(user)

    db.commit()
    print(f"  ✅ Created {len(users)} users")
    return users


def seed_tracks(db: Session) -> list[Track]:
    """Create sample tracks."""
    print("Creating tracks...")
    tracks = []

    for track_data in SAMPLE_TRACKS:
        track = Track(
            title=track_data['title'],
            artist=track_data['artist'],
            album=track_data['album'],
            genre=track_data['genre'],
            mood=track_data['mood'],
            duration=track_data['duration'],
            file_path=f"/data/music/{track_data['title'].replace(' ', '_').lower()}.mp3",
            play_count=random.randint(0, 1000),
        )
        db.add(track)
        tracks.append(track)

    db.commit()
    print(f"  ✅ Created {len(tracks)} tracks")
    return tracks


def seed_playlists(db: Session, users: list[User], tracks: list[Track]) -> list[Playlist]:
    """Create sample playlists."""
    print("Creating playlists...")
    playlists = []

    for i, playlist_data in enumerate(SAMPLE_PLAYLISTS):
        # Assign playlist to random user
        owner = users[i % len(users)]

        playlist = Playlist(
            name=playlist_data['name'],
            description=playlist_data['description'],
            owner_id=owner.id,
            is_public=random.choice([True, True, False]),  # 2/3 public
        )
        db.add(playlist)
        db.flush()  # Get playlist ID

        # Add 3-5 random tracks to playlist
        num_tracks = random.randint(3, 5)
        selected_tracks = random.sample(tracks, min(num_tracks, len(tracks)))

        for position, track in enumerate(selected_tracks):
            playlist_track = PlaylistTrack(
                playlist_id=playlist.id,
                track_id=track.id,
                position=position,
            )
            db.add(playlist_track)

        playlists.append(playlist)

    db.commit()
    print(f"  ✅ Created {len(playlists)} playlists")
    return playlists


def seed_favorites(db: Session, users: list[User], tracks: list[Track]):
    """Create sample favorites."""
    print("Creating favorites...")
    count = 0

    for user in users:
        # Each user favorites 2-4 random tracks
        num_favorites = random.randint(2, 4)
        favorite_tracks = random.sample(tracks, min(num_favorites, len(tracks)))

        for track in favorite_tracks:
            favorite = UserFavorite(
                user_id=user.id,
                track_id=track.id,
            )
            db.add(favorite)
            count += 1

    db.commit()
    print(f"  ✅ Created {count} favorites")


def seed_listening_history(db: Session, users: list[User], tracks: list[Track]):
    """Create sample listening history."""
    print("Creating listening history...")
    count = 0

    for user in users:
        # Each user has 5-10 listening history entries
        num_plays = random.randint(5, 10)

        for i in range(num_plays):
            track = random.choice(tracks)
            days_ago = random.randint(0, 30)

            history = ListeningHistory(
                user_id=user.id,
                track_id=track.id,
                played_at=datetime.utcnow() - timedelta(days=days_ago),
            )
            db.add(history)
            count += 1

            # Update track play count
            track.play_count += 1

    db.commit()
    print(f"  ✅ Created {count} listening history entries")


def seed_ratings(db: Session, users: list[User], tracks: list[Track]):
    """Create sample track ratings."""
    print("Creating ratings...")
    count = 0

    for user in users:
        # Each user rates 2-3 tracks
        num_ratings = random.randint(2, 3)
        rated_tracks = random.sample(tracks, min(num_ratings, len(tracks)))

        for track in rated_tracks:
            rating = TrackRating(
                user_id=user.id,
                track_id=track.id,
                rating=random.randint(3, 5),  # 3-5 stars
            )
            db.add(rating)
            count += 1

    db.commit()
    print(f"  ✅ Created {count} ratings")


def seed_follows(db: Session, users: list[User]):
    """Create sample user follows."""
    print("Creating follows...")
    count = 0

    for user in users:
        # Each user follows 1-3 other users
        num_follows = random.randint(1, 3)
        potential_follows = [u for u in users if u.id != user.id]
        followed_users = random.sample(potential_follows, min(num_follows, len(potential_follows)))

        for followed_user in followed_users:
            follow = UserFollow(
                follower_id=user.id,
                following_id=followed_user.id,
            )
            db.add(follow)
            count += 1

    db.commit()
    print(f"  ✅ Created {count} follows")


def seed_activity_feed(db: Session, users: list[User], tracks: list[Track], playlists: list[Playlist]):
    """Create sample activity feed entries."""
    print("Creating activity feed...")
    count = 0

    activity_types = ['favorited_track', 'created_playlist', 'shared_track']

    for user in users:
        # Each user has 2-4 activities
        num_activities = random.randint(2, 4)

        for i in range(num_activities):
            activity_type = random.choice(activity_types)
            days_ago = random.randint(0, 7)

            if activity_type == 'favorited_track':
                track = random.choice(tracks)
                activity = ActivityFeed(
                    user_id=user.id,
                    activity_type=activity_type,
                    track_id=track.id,
                    created_at=datetime.utcnow() - timedelta(days=days_ago),
                )
            elif activity_type == 'created_playlist':
                playlist = random.choice([p for p in playlists if p.owner_id == user.id])
                activity = ActivityFeed(
                    user_id=user.id,
                    activity_type=activity_type,
                    playlist_id=playlist.id,
                    created_at=datetime.utcnow() - timedelta(days=days_ago),
                )
            else:  # shared_track
                track = random.choice(tracks)
                activity = ActivityFeed(
                    user_id=user.id,
                    activity_type=activity_type,
                    track_id=track.id,
                    created_at=datetime.utcnow() - timedelta(days=days_ago),
                )

            db.add(activity)
            count += 1

    db.commit()
    print(f"  ✅ Created {count} activity feed entries")


def clear_existing_data(db: Session):
    """Clear all existing data (use with caution!)."""
    print("⚠️  Clearing existing data...")

    # Delete in correct order to respect foreign keys
    db.query(ActivityFeed).delete()
    db.query(UserFollow).delete()
    db.query(TrackRating).delete()
    db.query(ListeningHistory).delete()
    db.query(UserFavorite).delete()
    db.query(PlaylistTrack).delete()
    db.query(Playlist).delete()
    db.query(Track).delete()
    db.query(User).delete()

    db.commit()
    print("  ✅ Cleared existing data")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Seed test data for development')
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear existing data before seeding'
    )

    args = parser.parse_args()

    db = SessionLocal()

    try:
        if args.clear:
            confirm = input("⚠️  This will DELETE all existing data. Continue? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Aborted.")
                return
            clear_existing_data(db)

        print("\n🌱 Seeding test data...\n")

        users = seed_users(db)
        tracks = seed_tracks(db)
        playlists = seed_playlists(db, users, tracks)
        seed_favorites(db, users, tracks)
        seed_listening_history(db, users, tracks)
        seed_ratings(db, users, tracks)
        seed_follows(db, users)
        seed_activity_feed(db, users, tracks, playlists)

        print("\n✅ Seeding complete!")
        print(f"\nTest credentials:")
        print(f"  Username: alice (or bob, charlie, diana, eve)")
        print(f"  Password: password123")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == '__main__':
    main()

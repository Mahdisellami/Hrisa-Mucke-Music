#!/usr/bin/env python3
"""
Migration script: music.json → SQLite database
Run once to initialize database with existing track data

Usage:
    python backend/migrations/migrate_to_db.py
"""

import sys
import json
import os
from pathlib import Path
from getpass import getpass

# Add parent directory to path to import backend modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from models.db_models import Base, User, Track, Playlist, PlaylistTrack
from utils.database import engine, SessionLocal
from utils.auth import hash_password


def load_music_json(json_path: str = "music.json") -> list:
    """Load existing music.json file"""
    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found. Starting with empty database.")
        return []

    with open(json_path, 'r') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} tracks from {json_path}")
    return data


def create_admin_user(db: Session) -> User:
    """Create the first admin user"""
    print("\n=== Create Admin Account ===")
    username = input("Admin username: ").strip()
    while len(username) < 3:
        print("Username must be at least 3 characters")
        username = input("Admin username: ").strip()

    email = input("Admin email: ").strip()
    while '@' not in email:
        print("Invalid email format")
        email = input("Admin email: ").strip()

    password = getpass("Admin password (min 6 characters): ")
    while len(password) < 6:
        print("Password must be at least 6 characters")
        password = getpass("Admin password (min 6 characters): ")

    password_confirm = getpass("Confirm password: ")
    while password != password_confirm:
        print("Passwords don't match")
        password = getpass("Admin password (min 6 characters): ")
        password_confirm = getpass("Confirm password: ")

    # Create admin user
    admin = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        display_name=username,
        is_admin=True
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print(f"\n✓ Admin user '{username}' created successfully")
    return admin


def migrate_tracks(db: Session, music_data: list, admin_user: User) -> dict:
    """
    Import tracks from music.json into database

    Returns dict with playlist names and their track IDs
    """
    print("\n=== Migrating Tracks ===")

    playlist_tracks = {}  # playlist_name -> list of track objects

    for idx, track_data in enumerate(music_data, 1):
        try:
            # Extract data from nested structure
            info_data = track_data['data']['info']['data']
            src_data = track_data['data']['src']['data']
            dest_data = track_data['data']['dest']['data']

            # Extract checksums
            info_checksum = track_data['data']['info']['checksum']
            src_checksum = track_data['data']['src']['checksum']
            dest_checksum = track_data['data']['dest']['checksum']
            track_checksum = track_data['checksum']

            # Determine playlist from file path
            dest_path = dest_data['path']  # e.g., "data/music/" or "data/workout/"
            playlist_name = dest_path.strip('/').split('/')[-1]  # Extract "music" or "workout"

            # Build full file path
            file_path = f"{dest_path}{dest_data['filename']}.mp3"

            # Extract YouTube video ID from URL
            youtube_url = src_data['url']
            video_id = None
            if 'youtu.be/' in youtube_url:
                video_id = youtube_url.split('youtu.be/')[-1].split('?')[0]
            elif 'youtube.com/watch?v=' in youtube_url:
                video_id = youtube_url.split('v=')[-1].split('&')[0]

            # Create track
            track = Track(
                title=info_data['title'],
                artist=info_data['artist'],
                album=info_data.get('album'),
                youtube_url=youtube_url,
                youtube_video_id=video_id,
                thumbnail_url=info_data.get('thumbnail'),
                file_path=file_path,
                lyrics_path=f"{dest_path}{dest_data['filename']}",  # Path without extension
                info_checksum=info_checksum,
                src_checksum=src_checksum,
                dest_checksum=dest_checksum,
                track_checksum=track_checksum,
                added_by_user_id=admin_user.id
            )

            db.add(track)
            db.flush()  # Get track.id without committing

            # Group by playlist
            if playlist_name not in playlist_tracks:
                playlist_tracks[playlist_name] = []
            playlist_tracks[playlist_name].append(track)

            print(f"  [{idx}/{len(music_data)}] Imported: {track.title} by {track.artist} → {playlist_name}")

        except Exception as e:
            print(f"  [ERROR] Failed to import track {idx}: {e}")
            continue

    db.commit()
    print(f"\n✓ Imported {sum(len(tracks) for tracks in playlist_tracks.values())} tracks")
    return playlist_tracks


def create_system_playlists(db: Session, playlist_tracks: dict, admin_user: User):
    """Create system playlists based on directory structure"""
    print("\n=== Creating System Playlists ===")

    for playlist_name, tracks in playlist_tracks.items():
        # Create playlist
        playlist = Playlist(
            name=playlist_name.capitalize(),
            description=f"System playlist for {playlist_name} tracks",
            owner_id=admin_user.id,
            is_public=True,
            playlist_type="system"
        )

        db.add(playlist)
        db.flush()

        # Add tracks to playlist
        for position, track in enumerate(tracks):
            playlist_track = PlaylistTrack(
                playlist_id=playlist.id,
                track_id=track.id,
                position=position,
                added_by_user_id=admin_user.id
            )
            db.add(playlist_track)

        print(f"  ✓ Created playlist '{playlist.name}' with {len(tracks)} tracks")

    db.commit()


def main():
    """Run the migration"""
    print("=" * 60)
    print("Music Tool Migration: music.json → SQLite Database")
    print("=" * 60)

    # Create all tables
    print("\n=== Creating Database Tables ===")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")

    # Create database session
    db = SessionLocal()

    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.is_admin == True).first()
        if existing_admin:
            print(f"\n⚠ Admin user '{existing_admin.username}' already exists")
            proceed = input("Continue with migration? (y/n): ").strip().lower()
            if proceed != 'y':
                print("Migration cancelled")
                return
            admin_user = existing_admin
        else:
            # Create admin user
            admin_user = create_admin_user(db)

        # Load music.json
        music_data = load_music_json("music.json")

        if not music_data:
            print("\n⚠ No tracks to import")
        else:
            # Migrate tracks
            playlist_tracks = migrate_tracks(db, music_data, admin_user)

            # Create playlists
            create_system_playlists(db, playlist_tracks, admin_user)

        # Summary
        print("\n" + "=" * 60)
        print("Migration Complete!")
        print("=" * 60)
        print(f"Users:     {db.query(User).count()}")
        print(f"Tracks:    {db.query(Track).count()}")
        print(f"Playlists: {db.query(Playlist).count()}")
        print("\nYou can now start the backend server and login with your admin account.")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    main()

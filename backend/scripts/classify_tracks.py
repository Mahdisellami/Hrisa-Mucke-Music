#!/usr/bin/env python3
"""
Track Genre and Mood Classification Script

Automatically classifies tracks based on title, artist, and album metadata.
Uses keyword matching and genre mapping to assign genres and moods to tracks.
"""

import sys
import os

# Add parent directory to path to import from models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from models.db_models import Track
from utils.database import SessionLocal
from typing import Dict, List, Tuple
import re


# Genre Keywords Mapping
GENRE_KEYWORDS = {
    'rock': ['rock', 'punk', 'metal', 'grunge', 'alternative', 'indie rock'],
    'pop': ['pop', 'top 40', 'mainstream', 'chart'],
    'hip-hop': ['hip hop', 'rap', 'trap', 'drill', 'grime'],
    'electronic': ['electronic', 'edm', 'house', 'techno', 'dubstep', 'electro', 'synth'],
    'jazz': ['jazz', 'bebop', 'swing', 'blues jazz'],
    'classical': ['classical', 'symphony', 'orchestra', 'piano', 'violin'],
    'r&b': ['r&b', 'soul', 'funk', 'motown'],
    'country': ['country', 'bluegrass', 'folk country'],
    'reggae': ['reggae', 'dancehall', 'ska'],
    'latin': ['latin', 'salsa', 'reggaeton', 'bachata', 'merengue'],
    'blues': ['blues'],
    'folk': ['folk', 'acoustic', 'singer-songwriter'],
}

# Mood Keywords Mapping
MOOD_KEYWORDS = {
    'happy': ['happy', 'joy', 'upbeat', 'cheerful', 'sunny', 'bright'],
    'sad': ['sad', 'melancholy', 'lonely', 'heartbreak', 'tears', 'blue'],
    'energetic': ['energy', 'pump', 'hype', 'power', 'intense', 'adrenaline'],
    'chill': ['chill', 'relax', 'calm', 'peaceful', 'ambient', 'lounge'],
    'romantic': ['love', 'romance', 'valentine', 'heart', 'kiss'],
    'angry': ['angry', 'rage', 'fury', 'aggressive', 'hate'],
    'motivational': ['motivate', 'inspire', 'workout', 'training', 'hustle'],
    'nostalgic': ['nostalgia', 'memory', 'throwback', 'retro', 'classic'],
}

# Artist Genre Mapping (common artists)
ARTIST_GENRES = {
    'the beatles': 'rock',
    'queen': 'rock',
    'led zeppelin': 'rock',
    'pink floyd': 'rock',
    'nirvana': 'rock',
    'radiohead': 'rock',
    'taylor swift': 'pop',
    'ariana grande': 'pop',
    'billie eilish': 'pop',
    'drake': 'hip-hop',
    'kendrick lamar': 'hip-hop',
    'kanye west': 'hip-hop',
    'daft punk': 'electronic',
    'deadmau5': 'electronic',
    'skrillex': 'electronic',
    'miles davis': 'jazz',
    'john coltrane': 'jazz',
    'ella fitzgerald': 'jazz',
    'mozart': 'classical',
    'beethoven': 'classical',
    'bach': 'classical',
    'beyoncé': 'r&b',
    'frank ocean': 'r&b',
    'the weeknd': 'r&b',
}


def classify_genre(track: Track) -> str:
    """
    Classify track genre based on metadata.

    Priority:
    1. Existing genre (if valid)
    2. Artist mapping
    3. Title/Album keywords
    4. Default to 'other'
    """
    # If track already has a valid genre, keep it
    if track.genre and track.genre.lower() in GENRE_KEYWORDS:
        return track.genre.lower()

    # Check artist mapping
    artist_lower = track.artist.lower() if track.artist else ''
    if artist_lower in ARTIST_GENRES:
        return ARTIST_GENRES[artist_lower]

    # Check keywords in title and album
    text = f"{track.title} {track.artist} {track.album}".lower()

    genre_scores: Dict[str, int] = {}
    for genre, keywords in GENRE_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > 0:
            genre_scores[genre] = score

    # Return genre with highest score
    if genre_scores:
        return max(genre_scores, key=genre_scores.get)

    return 'other'


def classify_mood(track: Track) -> str:
    """
    Classify track mood based on metadata.

    Uses keyword matching in title and album.
    Returns None if no mood can be determined.
    """
    text = f"{track.title} {track.album}".lower()

    mood_scores: Dict[str, int] = {}
    for mood, keywords in MOOD_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > 0:
            mood_scores[mood] = score

    # Return mood with highest score
    if mood_scores:
        return max(mood_scores, key=mood_scores.get)

    return None


def classify_all_tracks(db: Session, dry_run: bool = False) -> Tuple[int, int]:
    """
    Classify all tracks in database.

    Args:
        db: Database session
        dry_run: If True, don't commit changes

    Returns:
        Tuple of (tracks_updated, tracks_total)
    """
    tracks = db.query(Track).all()
    total = len(tracks)
    updated = 0

    print(f"Found {total} tracks to classify...")

    for track in tracks:
        original_genre = track.genre
        original_mood = track.mood

        # Classify genre and mood
        new_genre = classify_genre(track)
        new_mood = classify_mood(track)

        # Update if changed
        genre_changed = new_genre != original_genre
        mood_changed = new_mood != original_mood

        if genre_changed or mood_changed:
            track.genre = new_genre
            track.mood = new_mood
            updated += 1

            print(f"  [{track.id}] {track.title} by {track.artist}")
            if genre_changed:
                print(f"    Genre: {original_genre or 'None'} -> {new_genre}")
            if mood_changed:
                print(f"    Mood: {original_mood or 'None'} -> {new_mood or 'None'}")

    if not dry_run:
        db.commit()
        print(f"\n✅ Updated {updated} out of {total} tracks")
    else:
        print(f"\n🔍 DRY RUN: Would update {updated} out of {total} tracks")

    return updated, total


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Classify tracks by genre and mood'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without committing'
    )

    args = parser.parse_args()

    db = SessionLocal()
    try:
        classify_all_tracks(db, dry_run=args.dry_run)
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == '__main__':
    main()

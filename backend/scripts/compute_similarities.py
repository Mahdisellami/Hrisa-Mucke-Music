#!/usr/bin/env python3
"""
Background job to compute track similarities

This script should be run periodically (e.g., daily via cron) to precompute
track similarity scores for fast recommendations.

Usage:
    python scripts/compute_similarities.py [--batch-size 100]
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import from backend modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import argparse
from datetime import datetime
from utils.database import SessionLocal
from utils.recommendations import precompute_track_similarities


def main():
    parser = argparse.ArgumentParser(
        description="Precompute track similarities for recommendations"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Number of tracks to process before committing (default: 100)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of tracks to process (for testing)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Track Similarity Computation Job")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    # Create database session
    db = SessionLocal()

    try:
        # Check track count
        from models.db_models import Track
        total_tracks = db.query(Track).count()

        if total_tracks == 0:
            print("⚠️  No tracks found in database. Nothing to compute.")
            return

        print(f"📊 Found {total_tracks} tracks in database")
        print(f"⚙️  Batch size: {args.batch_size}")

        if args.limit:
            print(f"🔬 Test mode: Processing only {args.limit} tracks")

        print()
        print("Starting computation...")
        print("-" * 60)

        # Run the computation
        if args.limit:
            # For testing: process only first N tracks
            from models.db_models import Track
            limited_tracks = db.query(Track).order_by(
                Track.play_count.desc()
            ).limit(args.limit).all()

            print(f"Processing {len(limited_tracks)} tracks (limited)...")

            for i, track in enumerate(limited_tracks):
                print(f"[{i+1}/{len(limited_tracks)}] {track.title} by {track.artist}")

                # Compute similarities for this track
                from utils.recommendations import compute_track_similarity, get_content_based_recommendations
                from models.db_models import TrackSimilarity

                similar_track_scores = compute_track_similarity(track.id, db)
                content_similar = get_content_based_recommendations(track.id, db, limit=20)

                # Combine scores
                similarity_dict = {}
                for similar_id, score in similar_track_scores[:20]:
                    similarity_dict[similar_id] = score * 0.7

                for j, similar_track in enumerate(content_similar[:20]):
                    content_score = 1.0 - (j * 0.05)
                    if similar_track.id in similarity_dict:
                        similarity_dict[similar_track.id] += content_score * 0.3
                    else:
                        similarity_dict[similar_track.id] = content_score * 0.3

                # Update database
                sorted_similar = sorted(
                    similarity_dict.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:20]

                for similar_id, score in sorted_similar:
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

                if (i + 1) % args.batch_size == 0:
                    db.commit()
                    print(f"  ✓ Committed batch at {i+1} tracks")

            db.commit()
        else:
            # Full computation
            precompute_track_similarities(db, batch_size=args.batch_size)

        print()
        print("-" * 60)
        print("✅ Computation completed successfully!")

        # Print statistics
        from models.db_models import TrackSimilarity
        total_similarities = db.query(TrackSimilarity).filter(
            TrackSimilarity.algorithm == "hybrid"
        ).count()

        print()
        print("📈 Statistics:")
        print(f"  Total tracks: {total_tracks}")
        print(f"  Total similarities computed: {total_similarities}")
        print(f"  Average similarities per track: {total_similarities / total_tracks:.1f}")

    except KeyboardInterrupt:
        print()
        print("⚠️  Interrupted by user. Rolling back uncommitted changes...")
        db.rollback()
        print("✓ Rollback complete")
        return 1

    except Exception as e:
        print()
        print(f"❌ Error during computation: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return 1

    finally:
        db.close()
        print()
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())

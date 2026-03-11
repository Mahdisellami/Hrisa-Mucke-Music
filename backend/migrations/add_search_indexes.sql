-- Migration: Add indexes for search and discovery optimization
-- Date: 2024-03-11
-- Purpose: Improve performance of search, discovery, and social features

-- Track search indexes
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);

-- Discovery indexes (already exist in db_models.py but ensuring they're created)
-- Genre and mood are already indexed in the model

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Listening history indexes for trending/recommendations
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);

-- User follow indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_following ON user_follows(follower_id, following_id);

-- Playlist indexes for discovery
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public);

-- User search indexes
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_display_name_lower ON users(LOWER(display_name));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tracks_genre_play_count ON tracks(genre, play_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_mood_play_count ON tracks(mood, play_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at_desc ON tracks(created_at DESC);

-- Full-text search support (if using PostgreSQL, uncomment these)
-- CREATE INDEX IF NOT EXISTS idx_tracks_title_fulltext ON tracks USING gin(to_tsvector('english', title));
-- CREATE INDEX IF NOT EXISTS idx_tracks_artist_fulltext ON tracks USING gin(to_tsvector('english', artist));
-- CREATE INDEX IF NOT EXISTS idx_tracks_album_fulltext ON tracks USING gin(to_tsvector('english', album));

-- For SQLite (which is likely being used based on music.db file)
-- SQLite has limited full-text search support, so we rely on LIKE queries with the above indexes

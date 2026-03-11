/**
 * API Endpoint Functions
 *
 * Type-safe functions for all backend API endpoints
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  thumbnail_url?: string;
  genre?: string;
  mood?: string;
  play_count: number;
  file_path?: string;
}

export interface Artist {
  name: string;
  track_count: number;
}

export interface Album {
  album: string;
  artist: string;
  track_count: number;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  owner_username?: string;
  is_public: boolean;
  track_count?: number;
  song_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  is_admin: boolean;
}

export interface Genre {
  genre: string;
  count: number;
}

export interface Mood {
  mood: string;
  count: number;
}

export interface TrendingTrack {
  track: Track;
  recent_plays: number;
}

export interface SimilarTrack extends Track {
  similarity_score: number;
}

export interface UserProfile {
  user: User;
  stats: {
    playlists: number;
    followers: number;
    following: number;
    total_plays: number;
  };
}

export interface Activity {
  id: number;
  user_id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  activity_type: string;
  created_at: string;
  track_id?: number;
  track_title?: string;
  track_artist?: string;
  playlist_id?: number;
  playlist_name?: string;
  target_user_id?: number;
  target_username?: string;
}

export interface RadioStation {
  station_id: string;
  station_name: string;
  description: string;
  tracks: Track[];
}

// ============================================================================
// Search Endpoints
// ============================================================================

export const searchTracks = async (
  query: string,
  options?: { genre?: string; mood?: string; limit?: number; offset?: number }
): Promise<Track[]> => {
  const params = new URLSearchParams({ q: query });
  if (options?.genre) params.append('genre', options.genre);
  if (options?.mood) params.append('mood', options.mood);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await api.get<Track[]>(`/api/search/tracks?${params.toString()}`);
  return response.data;
};

export const searchArtists = async (query: string, limit = 20): Promise<Artist[]> => {
  const response = await api.get<Artist[]>(`/api/search/artists?q=${query}&limit=${limit}`);
  return response.data;
};

export const searchAlbums = async (query: string, limit = 20): Promise<Album[]> => {
  const response = await api.get<Album[]>(`/api/search/albums?q=${query}&limit=${limit}`);
  return response.data;
};

export const searchPlaylists = async (
  query: string,
  publicOnly = true,
  limit = 20
): Promise<Playlist[]> => {
  const response = await api.get<Playlist[]>(
    `/api/search/playlists?q=${query}&public_only=${publicOnly}&limit=${limit}`
  );
  return response.data;
};

export const searchUsers = async (query: string, limit = 20): Promise<User[]> => {
  const response = await api.get<User[]>(`/api/search/users?q=${query}&limit=${limit}`);
  return response.data;
};

// ============================================================================
// Discovery Endpoints
// ============================================================================

export const getGenres = async (): Promise<Genre[]> => {
  const response = await api.get<Genre[]>('/api/discover/genres');
  return response.data;
};

export const getGenreTracks = async (
  genre: string,
  options?: { limit?: number; sort?: 'popular' | 'recent' }
): Promise<Track[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.sort) params.append('sort', options.sort);

  const response = await api.get<Track[]>(
    `/api/discover/genres/${encodeURIComponent(genre)}/tracks?${params.toString()}`
  );
  return response.data;
};

export const getMoods = async (): Promise<Mood[]> => {
  const response = await api.get<Mood[]>('/api/discover/moods');
  return response.data;
};

export const getMoodTracks = async (
  mood: string,
  options?: { limit?: number; sort?: 'popular' | 'recent' }
): Promise<Track[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.sort) params.append('sort', options.sort);

  const response = await api.get<Track[]>(
    `/api/discover/moods/${encodeURIComponent(mood)}/tracks?${params.toString()}`
  );
  return response.data;
};

export const getTrending = async (
  timeframe: 'day' | 'week' | 'month' | 'all' = 'week',
  limit = 50
): Promise<TrendingTrack[]> => {
  const response = await api.get<TrendingTrack[]>(
    `/api/discover/trending?timeframe=${timeframe}&limit=${limit}`
  );
  return response.data;
};

export const getNewReleases = async (days = 30, limit = 50): Promise<Track[]> => {
  const response = await api.get<Track[]>(
    `/api/discover/new-releases?days=${days}&limit=${limit}`
  );
  return response.data;
};

export const getPopularPlaylists = async (limit = 20): Promise<Playlist[]> => {
  const response = await api.get<Playlist[]>(
    `/api/discover/popular-playlists?limit=${limit}`
  );
  return response.data;
};

export const getArtistTracks = async (
  artist: string,
  options?: { limit?: number; sort?: 'popular' | 'recent' | 'album' }
): Promise<Track[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.sort) params.append('sort', options.sort);

  const response = await api.get<Track[]>(
    `/api/discover/artist/${encodeURIComponent(artist)}/tracks?${params.toString()}`
  );
  return response.data;
};

export const getAlbumTracks = async (artist: string, album: string): Promise<Track[]> => {
  const response = await api.get<Track[]>(
    `/api/discover/album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}/tracks`
  );
  return response.data;
};

// ============================================================================
// Recommendation Endpoints
// ============================================================================

export const getRecommendationsForYou = async (
  options?: { limit?: number; algorithm?: 'hybrid' | 'collaborative' | 'content' }
): Promise<Track[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.algorithm) params.append('algorithm', options.algorithm);

  const response = await api.get<Track[]>(
    `/api/recommendations/for-you?${params.toString()}`
  );
  return response.data;
};

export const getSimilarTracks = async (
  trackId: number,
  options?: { limit?: number; algorithm?: 'hybrid' | 'collaborative' | 'content' }
): Promise<SimilarTrack[]> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.algorithm) params.append('algorithm', options.algorithm);

  const response = await api.get<SimilarTrack[]>(
    `/api/recommendations/similar-tracks/${trackId}?${params.toString()}`
  );
  return response.data;
};

export const getDailyMix = async (limit = 50): Promise<Track[]> => {
  const response = await api.get<Track[]>(
    `/api/recommendations/daily-mix?limit=${limit}`
  );
  return response.data;
};

export const getDiscoverWeekly = async (limit = 30): Promise<Track[]> => {
  const response = await api.get<Track[]>(
    `/api/recommendations/discover-weekly?limit=${limit}`
  );
  return response.data;
};

export const getBecauseYouLiked = async (
  trackId: number,
  limit = 20
): Promise<SimilarTrack[]> => {
  const response = await api.get<SimilarTrack[]>(
    `/api/recommendations/because-you-liked/${trackId}?limit=${limit}`
  );
  return response.data;
};

// ============================================================================
// Radio Endpoints
// ============================================================================

export const startRadioStation = async (
  seedType: 'track' | 'artist' | 'genre' | 'mood',
  seedValue: string | number,
  limit = 50
): Promise<RadioStation> => {
  const response = await api.post<RadioStation>('/api/radio/start-station', {
    seed_type: seedType,
    seed_value: seedValue,
  });
  return response.data;
};

export const getNextRadioTracks = async (
  stationId: string,
  count = 10,
  offset = 0
): Promise<Track[]> => {
  const response = await api.get<Track[]>(
    `/api/radio/next-tracks/${stationId}?count=${count}&offset=${offset}`
  );
  return response.data;
};

export const getMyRadioStations = async (): Promise<RadioStation[]> => {
  const response = await api.get<RadioStation[]>('/api/radio/my-stations');
  return response.data;
};

// ============================================================================
// Social Endpoints
// ============================================================================

export const followUser = async (userId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/api/social/follow/${userId}`);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/social/unfollow/${userId}`);
  return response.data;
};

export const getFollowers = async (userId: number): Promise<User[]> => {
  const response = await api.get<User[]>(`/api/social/followers/${userId}`);
  return response.data;
};

export const getFollowing = async (userId: number): Promise<User[]> => {
  const response = await api.get<User[]>(`/api/social/following/${userId}`);
  return response.data;
};

export const isFollowing = async (userId: number): Promise<boolean> => {
  const response = await api.get<{ is_following: boolean }>(
    `/api/social/is-following/${userId}`
  );
  return response.data.is_following;
};

export const getActivityFeed = async (
  limit = 50,
  offset = 0
): Promise<Activity[]> => {
  const response = await api.get<Activity[]>(
    `/api/social/feed?limit=${limit}&offset=${offset}`
  );
  return response.data;
};

export const getUserActivity = async (userId: number, limit = 50): Promise<Activity[]> => {
  const response = await api.get<Activity[]>(
    `/api/social/activity/${userId}?limit=${limit}`
  );
  return response.data;
};

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const response = await api.get<UserProfile>(`/api/social/profile/${userId}`);
  return response.data;
};

export const sharePlaylist = async (
  playlistId: number
): Promise<{ share_url: string; message: string }> => {
  const response = await api.post<{ share_url: string; message: string }>(
    `/api/social/share/playlist/${playlistId}`
  );
  return response.data;
};

export const shareTrack = async (trackId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/api/social/share/track/${trackId}`
  );
  return response.data;
};

export const getUserPublicPlaylists = async (userId: number): Promise<Playlist[]> => {
  const response = await api.get<Playlist[]>(`/api/playlists/user/${userId}/public`);
  return response.data;
};

// Alias for isFollowing
export const isFollowingUser = isFollowing;

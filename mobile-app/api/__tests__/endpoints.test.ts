import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  searchTracks,
  getGenres,
  getRecommendationsForYou,
  followUser,
  unfollowUser,
  getActivityFeed,
  getUserProfile,
  shareTrack,
  type Track,
  type Genre,
  type UserProfile,
  type Activity,
} from '../endpoints';
import { api } from '../client';

// Create axios mock
const mock = new MockAdapter(api);

describe('API Endpoints', () => {
  afterEach(() => {
    mock.reset();
  });

  describe('Search Endpoints', () => {
    it('searchTracks returns track results', async () => {
      const mockTracks: Track[] = [
        {
          id: 1,
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          genre: 'Rock',
          mood: 'Happy',
          duration: 180,
          play_count: 100,
          created_at: '2024-01-01',
        },
      ];

      mock.onGet(/\/api\/search\/tracks/).reply(200, mockTracks);

      const result = await searchTracks('test');

      expect(result).toEqual(mockTracks);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Song');
    });

    it('searchTracks handles query parameters', async () => {
      mock.onGet(/\/api\/search\/tracks/).reply(200, []);

      await searchTracks('test', { genre: 'Rock', limit: 10 });

      expect(mock.history.get[0].url).toContain('q=test');
      expect(mock.history.get[0].url).toContain('genre=Rock');
      expect(mock.history.get[0].url).toContain('limit=10');
    });

    it('searchTracks handles errors', async () => {
      mock.onGet(/\/api\/search\/tracks/).reply(500);

      await expect(searchTracks('test')).rejects.toThrow();
    });
  });

  describe('Discovery Endpoints', () => {
    it('getGenres returns genre list', async () => {
      const mockGenres: Genre[] = [
        { genre: 'Rock', count: 50 },
        { genre: 'Pop', count: 30 },
      ];

      mock.onGet(/\/api\/discover\/genres/).reply(200, mockGenres);

      const result = await getGenres();

      expect(result).toEqual(mockGenres);
      expect(result).toHaveLength(2);
    });

    it('getGenres handles empty response', async () => {
      mock.onGet(/\/api\/discover\/genres/).reply(200, []);

      const result = await getGenres();

      expect(result).toEqual([]);
    });
  });

  describe('Recommendation Endpoints', () => {
    it('getRecommendationsForYou returns tracks', async () => {
      const mockTracks: Track[] = [
        {
          id: 1,
          title: 'Recommended Song',
          artist: 'Artist',
          album: 'Album',
          genre: 'Pop',
          mood: null,
          duration: 200,
          play_count: 50,
          created_at: '2024-01-01',
        },
      ];

      mock.onGet(/\/api\/recommendations\/for-you/).reply(200, mockTracks);

      const result = await getRecommendationsForYou({ limit: 20 });

      expect(result).toEqual(mockTracks);
      expect(mock.history.get[0].url).toContain('limit=20');
    });

    it('getRecommendationsForYou handles algorithm parameter', async () => {
      mock.onGet(/\/api\/recommendations\/for-you/).reply(200, []);

      await getRecommendationsForYou({ algorithm: 'collaborative' });

      expect(mock.history.get[0].url).toContain('algorithm=collaborative');
    });
  });

  describe('Social Endpoints', () => {
    it('followUser calls correct endpoint', async () => {
      mock.onPost('/api/social/follow/123').reply(200, { message: 'Followed successfully' });

      const result = await followUser(123);

      expect(result.message).toBe('Followed successfully');
      expect(mock.history.post).toHaveLength(1);
    });

    it('unfollowUser calls correct endpoint', async () => {
      mock.onDelete('/api/social/unfollow/123').reply(200, { message: 'Unfollowed' });

      const result = await unfollowUser(123);

      expect(result.message).toBe('Unfollowed');
      expect(mock.history.delete).toHaveLength(1);
    });

    it('getActivityFeed returns activities', async () => {
      const mockActivities: Activity[] = [
        {
          id: 1,
          user_id: 123,
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: null,
          activity_type: 'favorited_track',
          track_id: 456,
          track_title: 'Song',
          track_artist: 'Artist',
          playlist_id: null,
          playlist_name: null,
          target_user_id: null,
          target_username: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mock.onGet(/\/api\/social\/feed/).reply(200, mockActivities);

      const result = await getActivityFeed(50, 0);

      expect(result).toEqual(mockActivities);
      expect(mock.history.get[0].url).toContain('limit=50');
      expect(mock.history.get[0].url).toContain('offset=0');
    });

    it('getUserProfile returns user data', async () => {
      const mockProfile: UserProfile = {
        user: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          display_name: 'Test User',
          bio: 'Test bio',
          avatar_url: null,
          created_at: '2024-01-01',
        },
        stats: {
          playlists: 5,
          followers: 10,
          following: 15,
          total_plays: 100,
        },
      };

      mock.onGet('/api/social/profile/123').reply(200, mockProfile);

      const result = await getUserProfile(123);

      expect(result).toEqual(mockProfile);
      expect(result.user.username).toBe('testuser');
      expect(result.stats.followers).toBe(10);
    });

    it('shareTrack calls correct endpoint', async () => {
      mock.onPost('/api/social/share/track/456').reply(200, { message: 'Shared' });

      const result = await shareTrack(456);

      expect(result.message).toBe('Shared');
      expect(mock.history.post[0].url).toContain('/track/456');
    });

    it('handles 404 errors', async () => {
      mock.onGet('/api/social/profile/999').reply(404);

      await expect(getUserProfile(999)).rejects.toThrow();
    });

    it('handles network errors', async () => {
      mock.onGet(/\/api\/social\/feed/).networkError();

      await expect(getActivityFeed()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles 401 unauthorized errors', async () => {
      mock.onGet(/\/api\/recommendations\/for-you/).reply(401);

      await expect(getRecommendationsForYou()).rejects.toThrow();
    });

    it('handles 500 server errors', async () => {
      mock.onGet(/\/api\/discover\/genres/).reply(500);

      await expect(getGenres()).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      mock.onGet(/\/api\/search\/tracks/).timeout();

      await expect(searchTracks('test')).rejects.toThrow();
    });
  });
});

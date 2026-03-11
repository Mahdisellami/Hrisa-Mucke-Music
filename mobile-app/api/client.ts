import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "@/utils/storage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL_KEY = "@backend_url";
const ACCESS_TOKEN_KEY = "@access_token";

// Use production backend for web, local IP for mobile
const DEFAULT_BACKEND_URL = Platform.OS === "web"
  ? "https://music-tool-backend.onrender.com"
  : "http://192.168.2.155:8000";

// Create axios instance with default URL
export const api = axios.create({
  baseURL: DEFAULT_BACKEND_URL,
  timeout: 300000, // 5 minutes for long operations like downloading MP3s
});

// Load saved backend URL on app start
export const initializeApiClient = async () => {
  try {
    const savedUrl = await storage.getItem(BACKEND_URL_KEY);
    if (savedUrl) {
      api.defaults.baseURL = savedUrl;
      console.log("Backend URL loaded from storage:", savedUrl);
    } else {
      console.log("Using default backend URL:", DEFAULT_BACKEND_URL);
    }
  } catch (error) {
    console.error("Error loading backend URL:", error);
  }
};

// Request interceptor: Add JWT token to all requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for login, register, and refresh endpoints
    const isAuthEndpoint = config.url?.includes("/api/auth/login") ||
                          config.url?.includes("/api/auth/register") ||
                          config.url?.includes("/api/auth/refresh");

    if (!isAuthEndpoint) {
      try {
        const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error("Error reading access token:", error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request is already refreshing the token, wait for it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token
        const refreshToken = await AsyncStorage.getItem("@refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Request new access token
        const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        // Save new tokens
        await AsyncStorage.multiSet([
          [ACCESS_TOKEN_KEY, access_token],
          ["@refresh_token", new_refresh_token],
        ]);

        // Update authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear tokens if refresh fails
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, "@refresh_token", "@user_data"]);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Call this on app start
initializeApiClient();

// ==================== Playlist API Methods ====================

export interface Playlist {
  id: number;
  name: string;
  song_count: number;
  created_at: string;
  updated_at: string;
}

export interface SongInPlaylist {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number | null;
  file_path: string;
  added_at: string;
}

export const playlistApi = {
  // Get all playlists for current user
  getPlaylists: async (): Promise<Playlist[]> => {
    const response = await api.get("/playlists");
    return response.data;
  },

  // Create a new playlist
  createPlaylist: async (name: string): Promise<Playlist> => {
    const response = await api.post("/playlists", { name });
    return response.data;
  },

  // Rename a playlist
  renamePlaylist: async (playlistId: number, name: string): Promise<Playlist> => {
    const response = await api.put(`/playlists/${playlistId}`, { name });
    return response.data;
  },

  // Delete a playlist
  deletePlaylist: async (playlistId: number): Promise<void> => {
    await api.delete(`/playlists/${playlistId}`);
  },

  // Get songs in a playlist
  getPlaylistSongs: async (playlistId: number): Promise<SongInPlaylist[]> => {
    const response = await api.get(`/playlists/${playlistId}/songs`);
    return response.data;
  },

  // Add a song to a playlist
  addSongToPlaylist: async (playlistId: number, songId: number): Promise<void> => {
    await api.post(`/playlists/${playlistId}/songs`, { song_id: songId });
  },

  // Remove a song from a playlist
  removeSongFromPlaylist: async (playlistId: number, songId: number): Promise<void> => {
    await api.delete(`/playlists/${playlistId}/songs/${songId}`);
  },
};

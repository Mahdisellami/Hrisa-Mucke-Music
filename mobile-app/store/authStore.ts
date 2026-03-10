/**
 * Authentication state management with Zustand
 * Handles login, registration, token management, and user profile
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { api } from "@/api/client";

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateProfile: (data: { display_name?: string; avatar_url?: string; bio?: string }) => Promise<void>;
  loadStoredTokens: () => Promise<void>;
  clearError: () => void;
}

const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "@access_token",
  REFRESH_TOKEN: "@refresh_token",
  USER: "@user_data",
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Register new account
  register: async (username: string, email: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<TokenResponse>(`${api.defaults.baseURL}/api/auth/register`, {
        username,
        email,
        password,
        display_name: displayName,
      });

      const { access_token, refresh_token, user } = response.data;

      // Store tokens and user data
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.ACCESS_TOKEN, access_token],
        [AUTH_STORAGE_KEYS.REFRESH_TOKEN, refresh_token],
        [AUTH_STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      set({
        error: err.response?.data?.detail || "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  // Login with username and password
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<TokenResponse>(`${api.defaults.baseURL}/api/auth/login`, {
        username,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      // Store tokens and user data
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.ACCESS_TOKEN, access_token],
        [AUTH_STORAGE_KEYS.REFRESH_TOKEN, refresh_token],
        [AUTH_STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      set({
        error: err.response?.data?.detail || "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  // Logout and clear all stored data
  logout: async () => {
    set({ isLoading: true });
    try {
      // Call backend logout (optional, since JWT is stateless)
      if (get().accessToken) {
        await api.post("/api/auth/logout");
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens and user data
      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_STORAGE_KEYS.REFRESH_TOKEN,
        AUTH_STORAGE_KEYS.USER,
      ]);

      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Refresh access token using refresh token
  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await axios.post<TokenResponse>(`${api.defaults.baseURL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: new_refresh_token, user } = response.data;

      // Store new tokens
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.ACCESS_TOKEN, access_token],
        [AUTH_STORAGE_KEYS.REFRESH_TOKEN, new_refresh_token],
        [AUTH_STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      set({
        accessToken: access_token,
        refreshToken: new_refresh_token,
        user,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear auth state if refresh fails
      await get().logout();
      return false;
    }
  },

  // Update user profile
  updateProfile: async (data: { display_name?: string; avatar_url?: string; bio?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<User>("/api/auth/me", data);

      // Update stored user data
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.data));

      set({
        user: response.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      set({
        error: err.response?.data?.detail || "Profile update failed",
        isLoading: false,
      });
      throw error;
    }
  },

  // Load stored tokens on app start
  loadStoredTokens: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken, userData] = await AsyncStorage.multiGet([
        AUTH_STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_STORAGE_KEYS.REFRESH_TOKEN,
        AUTH_STORAGE_KEYS.USER,
      ]);

      const access = accessToken[1];
      const refresh = refreshToken[1];
      const user = userData[1] ? JSON.parse(userData[1]) : null;

      if (access && refresh && user) {
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Optionally verify token is still valid by fetching user profile
        try {
          const response = await api.get<User>("/api/auth/me");
          set({ user: response.data });
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshed = await get().refreshAccessToken();
          if (!refreshed) {
            // Refresh failed, clear auth state
            await get().logout();
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to load stored tokens:", error);
      set({ isLoading: false });
    }
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));

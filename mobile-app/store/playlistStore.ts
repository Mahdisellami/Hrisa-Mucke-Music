import { create } from "zustand";
import { playlistApi, Playlist, SongInPlaylist } from "@/api/client";
import { Song } from "./musicStore";

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  currentPlaylistSongs: Song[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (playlistId: number, name: string) => Promise<void>;
  deletePlaylist: (playlistId: number) => Promise<void>;
  fetchPlaylistSongs: (playlistId: number) => Promise<void>;
  addSongToPlaylist: (playlistId: number, songId: number) => Promise<void>;
  removeSongFromPlaylist: (playlistId: number, songId: number) => Promise<void>;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  clearError: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  currentPlaylistSongs: [],
  isLoading: false,
  error: null,

  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const playlists = await playlistApi.getPlaylists();
      set({ playlists, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch playlists:", error);
      set({
        error: error.response?.data?.detail || "Failed to fetch playlists",
        isLoading: false,
      });
    }
  },

  createPlaylist: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const newPlaylist = await playlistApi.createPlaylist(name);
      set((state) => ({
        playlists: [...state.playlists, newPlaylist],
        isLoading: false,
      }));
      return newPlaylist;
    } catch (error: any) {
      console.error("Failed to create playlist:", error);
      const errorMsg = error.response?.data?.detail || "Failed to create playlist";
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  renamePlaylist: async (playlistId: number, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPlaylist = await playlistApi.renamePlaylist(playlistId, name);
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === playlistId ? updatedPlaylist : p
        ),
        currentPlaylist:
          state.currentPlaylist?.id === playlistId
            ? updatedPlaylist
            : state.currentPlaylist,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Failed to rename playlist:", error);
      const errorMsg = error.response?.data?.detail || "Failed to rename playlist";
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  deletePlaylist: async (playlistId: number) => {
    set({ isLoading: true, error: null });
    try {
      await playlistApi.deletePlaylist(playlistId);
      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== playlistId),
        currentPlaylist:
          state.currentPlaylist?.id === playlistId
            ? null
            : state.currentPlaylist,
        currentPlaylistSongs:
          state.currentPlaylist?.id === playlistId ? [] : state.currentPlaylistSongs,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Failed to delete playlist:", error);
      const errorMsg = error.response?.data?.detail || "Failed to delete playlist";
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  fetchPlaylistSongs: async (playlistId: number) => {
    set({ isLoading: true, error: null });
    try {
      const songsData = await playlistApi.getPlaylistSongs(playlistId);

      // Transform SongInPlaylist to Song format (compatible with musicStore)
      const songs: Song[] = songsData.map((s) => ({
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration || 0,
        url: `${playlistApi.getPlaylists}/../music/${s.file_path}`, // This will be constructed properly in music player
        id: s.id,
      }));

      set({ currentPlaylistSongs: songs, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch playlist songs:", error);
      set({
        error: error.response?.data?.detail || "Failed to fetch playlist songs",
        isLoading: false,
      });
    }
  },

  addSongToPlaylist: async (playlistId: number, songId: number) => {
    set({ isLoading: true, error: null });
    try {
      await playlistApi.addSongToPlaylist(playlistId, songId);

      // Update song count in playlists
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === playlistId ? { ...p, song_count: p.song_count + 1 } : p
        ),
        isLoading: false,
      }));

      // Refresh playlist songs if current playlist is active
      if (get().currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistSongs(playlistId);
      }
    } catch (error: any) {
      console.error("Failed to add song to playlist:", error);
      const errorMsg =
        error.response?.data?.detail || "Failed to add song to playlist";
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  removeSongFromPlaylist: async (playlistId: number, songId: number) => {
    set({ isLoading: true, error: null });
    try {
      await playlistApi.removeSongFromPlaylist(playlistId, songId);

      // Update song count in playlists
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === playlistId ? { ...p, song_count: p.song_count - 1 } : p
        ),
        currentPlaylistSongs: state.currentPlaylistSongs.filter(
          (s) => s.id !== songId
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Failed to remove song from playlist:", error);
      const errorMsg =
        error.response?.data?.detail || "Failed to remove song from playlist";
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  setCurrentPlaylist: (playlist: Playlist | null) => {
    set({ currentPlaylist: playlist });
  },

  clearError: () => {
    set({ error: null });
  },
}));

import { create } from "zustand";
import { api } from "@/api/client";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { WebAudioService } from "@/services/WebAudioService";

export interface Song {
  id?: number; // Song ID from database (optional for backwards compatibility)
  title: string;
  artist: string;
  album?: string | null;
  audioUrl: string;
  playlist: string;
  lyricsPath?: string; // Path to lyrics files (without extension)
  albumArt?: string; // Thumbnail URL from YouTube
  sourceUrl?: string; // YouTube source URL
  url?: string; // Alias for audioUrl (used by playlist songs)
  duration?: number; // Duration in seconds
}

export type RepeatMode = "off" | "one" | "all";
export type FilterMode = "all" | "favorites" | string; // string for playlist names
export type SortMode = "default" | "title" | "artist" | "album" | "recent";
export type EQPreset = "off" | "bass-boost" | "treble-boost" | "vocal" | "rock" | "jazz" | "classical" | "electronic" | "custom";

export interface CustomPlaylist {
  id: string;
  name: string;
  songIndices: number[];
  createdAt: number;
}

export interface RecentlyPlayedEntry {
  songIndex: number;
  playedAt: number;
}

export interface EQBands {
  bass: number;      // 60Hz - 250Hz (-12 to +12 dB)
  mid: number;       // 250Hz - 4kHz (-12 to +12 dB)
  treble: number;    // 4kHz - 16kHz (-12 to +12 dB)
}

interface MusicStore {
  songs: Song[];
  loading: boolean;
  sound: Audio.Sound | null;
  currentSongIndex: number | null;
  isPlaying: boolean;
  queue: number[];
  queuePosition: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  originalQueue: number[];

  // New features
  playbackSpeed: number;
  crossfadeEnabled: boolean;
  sleepTimerEndTime: number | null;

  // Equalizer
  eqPreset: EQPreset;
  eqBands: EQBands;

  // Playback position
  position: number;
  duration: number;
  isSeekingInProgress: boolean;

  // Volume control
  volume: number;
  volumeNormalizationEnabled: boolean;

  // Search & Filter
  searchQuery: string;
  filterMode: FilterMode;
  sortMode: SortMode;
  setSearchQuery: (query: string) => void;
  setFilterMode: (mode: FilterMode) => void;
  setSortMode: (mode: SortMode) => void;
  getFilteredSongs: () => Song[];

  // Favorites
  favorites: Set<number>;
  toggleFavorite: (songIndex: number) => void;
  isFavorite: (songIndex: number) => boolean;
  loadFavorites: () => Promise<void>;

  // Recently Played
  recentlyPlayed: RecentlyPlayedEntry[];
  addToRecentlyPlayed: (songIndex: number) => Promise<void>;
  getRecentlyPlayedSongs: () => Song[];
  loadRecentlyPlayed: () => Promise<void>;

  // Custom Playlists
  customPlaylists: CustomPlaylist[];
  createCustomPlaylist: (name: string) => Promise<void>;
  deleteCustomPlaylist: (playlistId: string) => Promise<void>;
  renameCustomPlaylist: (playlistId: string, newName: string) => Promise<void>;
  addSongToCustomPlaylist: (playlistId: string, songIndex: number) => Promise<void>;
  removeSongFromCustomPlaylist: (playlistId: string, songIndex: number) => Promise<void>;
  loadCustomPlaylists: () => Promise<void>;

  // Queue Persistence
  saveQueueState: () => Promise<void>;
  loadQueueState: () => Promise<void>;

  // Existing functions
  fetchSongs: () => Promise<void>;
  populateDB: () => Promise<void>;
  populateData: () => Promise<void>;

  // Song management
  deleteSong: (songIndex: number, deleteFile: boolean) => Promise<void>;
  updateSongMetadata: (songIndex: number, title?: string, artist?: string, album?: string) => Promise<void>;

  // Playback controls
  playSound: (audioUrl: string, index: number) => Promise<void>;
  pauseSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;

  // Queue management
  setQueue: (songIndices: number[], startIndex?: number) => void;
  addToQueue: (songIndex: number) => void;
  removeFromQueue: (queueIndex: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;

  // Playlist controls
  playPlaylist: (playlistName: string, shuffle?: boolean) => Promise<void>;
  playCustomPlaylist: (playlistId: string, shuffle?: boolean) => Promise<void>;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;

  // New feature controls
  setPlaybackSpeed: (speed: number) => Promise<void>;
  toggleCrossfade: () => void;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  getSleepTimerRemaining: () => number;

  // Equalizer controls
  setEQPreset: (preset: EQPreset) => Promise<void>;
  setCustomEQ: (bands: EQBands) => Promise<void>;
  applyEQToSound: () => Promise<void>;

  // Seek controls
  seekToPosition: (positionMillis: number) => Promise<void>;

  // Volume control
  setVolume: (volume: number) => Promise<void>;
  toggleVolumeNormalization: () => void;
}

const FAVORITES_KEY = "@music_favorites";
const CUSTOM_PLAYLISTS_KEY = "@custom_playlists";
const QUEUE_STATE_KEY = "@queue_state";
const RECENTLY_PLAYED_KEY = "@recently_played";
const SORT_MODE_KEY = "@sort_mode";
const EQ_SETTINGS_KEY = "@eq_settings";

let sleepTimerTimeout: NodeJS.Timeout | null = null;
// Web Audio Service instance (only used on web platform)
let webAudioService: WebAudioService | null = Platform.OS === 'web' ? new WebAudioService() : null;

export const useMusicStore = create<MusicStore>((set, get) => ({
  songs: [],
  loading: false,
  sound: null,
  currentSongIndex: null,
  isPlaying: false,
  queue: [],
  queuePosition: -1,
  repeatMode: "off",
  isShuffled: false,
  originalQueue: [],

  // New feature state
  playbackSpeed: 1.0,
  crossfadeEnabled: false,
  sleepTimerEndTime: null,

  // Equalizer state
  eqPreset: "off",
  eqBands: { bass: 0, mid: 0, treble: 0 },

  // Playback position state
  position: 0,
  duration: 0,
  isSeekingInProgress: false,

  // Volume control state
  volume: 1.0,
  volumeNormalizationEnabled: false,

  // Search & Filter
  searchQuery: "",
  filterMode: "all",
  sortMode: "default",
  favorites: new Set<number>(),
  customPlaylists: [],
  recentlyPlayed: [],

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilterMode: (mode: FilterMode) => {
    set({ filterMode: mode });
  },

  setSortMode: async (mode: SortMode) => {
    set({ sortMode: mode });
    try {
      await AsyncStorage.setItem(SORT_MODE_KEY, mode);
    } catch (error) {
      console.error("Error saving sort mode:", error);
    }
  },

  getFilteredSongs: () => {
    const { songs, searchQuery, filterMode, sortMode, favorites, customPlaylists, recentlyPlayed } = get();
    let filtered = songs;

    // Apply filter mode
    if (filterMode === "favorites") {
      filtered = songs.filter((_, index) => favorites.has(index));
    } else if (filterMode === "recently_played") {
      // Show recently played songs in order
      filtered = recentlyPlayed
        .map(entry => songs[entry.songIndex])
        .filter(Boolean);
    } else if (filterMode !== "all") {
      // Check if it's a custom playlist
      const customPlaylist = customPlaylists.find((p) => p.id === filterMode);
      if (customPlaylist) {
        filtered = customPlaylist.songIndices.map((index) => songs[index]).filter(Boolean);
      } else {
        // Regular playlist filter
        filtered = songs.filter((song) => song.playlist === filterMode);
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          (song.album && song.album.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortMode !== "default") {
      // Create a copy and get indices for sorting
      const songsArray = songs;
      filtered = [...filtered].sort((a, b) => {
        switch (sortMode) {
          case "title":
            return a.title.localeCompare(b.title);
          case "artist":
            return a.artist.localeCompare(b.artist);
          case "album":
            const albumA = a.album || "";
            const albumB = b.album || "";
            return albumA.localeCompare(albumB);
          case "recent":
            const indexA = songsArray.indexOf(a);
            const indexB = songsArray.indexOf(b);
            const entryA = recentlyPlayed.find(e => e.songIndex === indexA);
            const entryB = recentlyPlayed.find(e => e.songIndex === indexB);
            const timeA = entryA ? entryA.playedAt : 0;
            const timeB = entryB ? entryB.playedAt : 0;
            return timeB - timeA; // Most recent first
          default:
            return 0;
        }
      });
    }

    return filtered;
  },

  // Favorites Management
  toggleFavorite: async (songIndex: number) => {
    const { favorites } = get();
    const newFavorites = new Set(favorites);

    if (newFavorites.has(songIndex)) {
      newFavorites.delete(songIndex);
    } else {
      newFavorites.add(songIndex);
    }

    set({ favorites: newFavorites });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  },

  isFavorite: (songIndex: number) => {
    return get().favorites.has(songIndex);
  },

  loadFavorites: async () => {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      if (data) {
        const favArray = JSON.parse(data);
        set({ favorites: new Set(favArray) });
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  },

  // Custom Playlists Management
  createCustomPlaylist: async (name: string) => {
    const { customPlaylists } = get();
    const newPlaylist: CustomPlaylist = {
      id: `custom_${Date.now()}`,
      name,
      songIndices: [],
      createdAt: Date.now(),
    };

    const updated = [...customPlaylists, newPlaylist];
    set({ customPlaylists: updated });

    try {
      await AsyncStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving custom playlists:", error);
    }
  },

  deleteCustomPlaylist: async (playlistId: string) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.filter((p) => p.id !== playlistId);
    set({ customPlaylists: updated });

    try {
      await AsyncStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error deleting custom playlist:", error);
    }
  },

  renameCustomPlaylist: async (playlistId: string, newName: string) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.map((p) =>
      p.id === playlistId ? { ...p, name: newName } : p
    );
    set({ customPlaylists: updated });

    try {
      await AsyncStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error renaming custom playlist:", error);
    }
  },

  addSongToCustomPlaylist: async (playlistId: string, songIndex: number) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.map((p) => {
      if (p.id === playlistId && !p.songIndices.includes(songIndex)) {
        return { ...p, songIndices: [...p.songIndices, songIndex] };
      }
      return p;
    });
    set({ customPlaylists: updated });

    try {
      await AsyncStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error adding song to custom playlist:", error);
    }
  },

  removeSongFromCustomPlaylist: async (playlistId: string, songIndex: number) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.map((p) => {
      if (p.id === playlistId) {
        return { ...p, songIndices: p.songIndices.filter((i) => i !== songIndex) };
      }
      return p;
    });
    set({ customPlaylists: updated });

    try {
      await AsyncStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error removing song from custom playlist:", error);
    }
  },

  loadCustomPlaylists: async () => {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      if (data) {
        const playlists = JSON.parse(data);
        set({ customPlaylists: playlists });
      }
    } catch (error) {
      console.error("Error loading custom playlists:", error);
    }
  },

  // Recently Played Management
  addToRecentlyPlayed: async (songIndex: number) => {
    const { recentlyPlayed } = get();

    // Remove existing entry for this song if any
    const filtered = recentlyPlayed.filter(e => e.songIndex !== songIndex);

    // Add new entry at the beginning
    const newEntry: RecentlyPlayedEntry = {
      songIndex,
      playedAt: Date.now(),
    };

    // Keep only last 50 entries
    const updated = [newEntry, ...filtered].slice(0, 50);

    set({ recentlyPlayed: updated });

    try {
      await AsyncStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving recently played:", error);
    }
  },

  getRecentlyPlayedSongs: () => {
    const { recentlyPlayed, songs } = get();
    return recentlyPlayed
      .map(entry => songs[entry.songIndex])
      .filter(Boolean);
  },

  loadRecentlyPlayed: async () => {
    try {
      const data = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      if (data) {
        const entries = JSON.parse(data);
        set({ recentlyPlayed: entries });
      }
    } catch (error) {
      console.error("Error loading recently played:", error);
    }
  },

  fetchSongs: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/music");
      const songs: Song[] = res.data.map((item: any) => {
        // Check if this is new database format (has 'id' field) or old music.json format
        if (item.id !== undefined) {
          // New database format with IDs
          const audioUrl = item.audioUrl || `${api.defaults.baseURL}/audio/${item.file_path}`;

          // Extract playlist from file path (e.g., "data/music/song.mp3" -> "music")
          const playlist = item.file_path
            ? item.file_path.split('/')[1] || "unknown"
            : "unknown";

          return {
            id: item.id,
            title: item.title || "",
            artist: item.artist || "",
            album: item.album || null,
            audioUrl,
            url: audioUrl, // Alias for compatibility
            playlist,
            duration: item.duration,
            sourceUrl: item.youtube_url,
          };
        } else {
          // Old music.json format (backwards compatibility)
          const info = item.data?.info?.data || {};
          const src = item.data?.src?.data || {};
          const dest = item.data?.dest?.data || {};
          const path = dest.path || "";
          const filename = dest.filename || "";
          const audioUrl = `${api.defaults.baseURL}/audio/${path}${filename}.mp3`;
          const lyricsPath = `${path}${filename}`; // Path without extension
          const albumArt = info.thumbnail || undefined; // YouTube thumbnail URL
          const sourceUrl = src.url || undefined; // YouTube source URL

          const playlist = path.replace(/^data\//, "").replace(/\/$/, "") || "unknown";

          return {
            title: info.title || "",
            artist: info.artist || "",
            album: info.album || null,
            audioUrl,
            url: audioUrl, // Alias for compatibility
            playlist,
            lyricsPath,
            albumArt,
            sourceUrl,
          };
        }
      });
      set({ songs });

      // Load favorites, custom playlists, recently played, and queue state after songs are loaded
      await get().loadFavorites();
      await get().loadCustomPlaylists();
      await get().loadRecentlyPlayed();
      await get().loadQueueState();

      // Load sort mode
      try {
        const sortMode = await AsyncStorage.getItem(SORT_MODE_KEY);
        if (sortMode) {
          set({ sortMode: sortMode as SortMode });
        }
      } catch (error) {
        console.error("Error loading sort mode:", error);
      }

      // Load EQ settings
      try {
        const eqData = await AsyncStorage.getItem(EQ_SETTINGS_KEY);
        if (eqData) {
          const { preset, bands } = JSON.parse(eqData);
          set({ eqPreset: preset, eqBands: bands });
        }
      } catch (error) {
        console.error("Error loading EQ settings:", error);
      }
    } finally {
      set({ loading: false });
    }
  },

  populateDB: async () => {
    await api.post("/populate/db/sync");
  },

  populateData: async () => {
    await api.post("/populate/data/sync");
  },

  // Delete Song
  deleteSong: async (songIndex: number, deleteFile: boolean = false) => {
    try {
      await api.delete(`/song/${songIndex}`, {
        params: { delete_file: deleteFile }
      });

      // Refresh songs list
      await get().fetchSongs();
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  },

  // Update Song Metadata
  updateSongMetadata: async (songIndex: number, title?: string, artist?: string, album?: string) => {
    try {
      const params = new URLSearchParams();
      if (title) params.append('title', title);
      if (artist) params.append('artist', artist);
      if (album) params.append('album', album);

      await api.patch(`/song/${songIndex}?${params.toString()}`);

      // Refresh songs list
      await get().fetchSongs();
    } catch (error) {
      console.error("Error updating song metadata:", error);
      throw error;
    }
  },

  playSound: async (audioUrl: string, index: number) => {
    const { sound, currentSongIndex, stopSound, queue, queuePosition, playbackSpeed, crossfadeEnabled, sleepTimerEndTime, setSleepTimer, volume, addToRecentlyPlayed, eqBands } = get();

    // Track this song in recently played
    addToRecentlyPlayed(index);

    // WEB PLATFORM: Use Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      try {
        // If switching tracks, load new track
        if (currentSongIndex !== index) {
          await webAudioService.loadTrack(audioUrl);
          webAudioService.setVolume(volume);
          webAudioService.setPlaybackRate(playbackSpeed);
          webAudioService.setEQ(eqBands);

          // Set up event listeners
          webAudioService.onTimeUpdate((time, duration) => {
            set({ position: time * 1000, duration: duration * 1000 });
          });

          webAudioService.onEnded(() => {
            set({ isPlaying: false, position: 0 });
            get().playNext();
          });

          const newQueuePosition = queue.indexOf(index);
          set({
            currentSongIndex: index,
            isPlaying: false,
            queuePosition: newQueuePosition >= 0 ? newQueuePosition : queuePosition,
            position: 0,
          });
          get().saveQueueState();
        }

        // Play the track
        await webAudioService.play();
        set({ isPlaying: true });

        // Auto-set 8-hour timer if no timer is active
        if (!sleepTimerEndTime) {
          setSleepTimer(480);
        }

        return; // Exit early for web
      } catch (error) {
        console.error("Web audio playback error:", error);
      }
    }

    // MOBILE PLATFORM: Continue with Expo AV below...

    // Crossfade: fade out current track before stopping
    if (sound && currentSongIndex !== index && crossfadeEnabled) {
      try {
        // Fade out over 2 seconds
        await sound.setVolumeAsync(0, { duration: 2000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Crossfade error:", error);
      }
    }

    if (sound && currentSongIndex !== index) {
      await stopSound();
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (sound && currentSongIndex === index) {
        await sound.playAsync();
        set({ isPlaying: true });

        // Auto-set 8-hour timer if no timer is active
        if (!sleepTimerEndTime) {
          setSleepTimer(480); // 480 minutes = 8 hours
        }

        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: false,
          rate: playbackSpeed,
          shouldCorrectPitch: true,
          volume: crossfadeEnabled ? 0 : volume,
        }
      );

      const newQueuePosition = queue.indexOf(index);

      // Update state with new sound before starting playback
      set({
        sound: newSound,
        currentSongIndex: index,
        isPlaying: false,
        queuePosition: newQueuePosition >= 0 ? newQueuePosition : queuePosition,
        position: 0,
      });

      // Save queue state after updating current song
      get().saveQueueState();

      // Start playback
      await newSound.playAsync();

      // Crossfade: fade in new track
      if (crossfadeEnabled) {
        await newSound.setVolumeAsync(volume, { duration: 2000 });
      }

      set({ isPlaying: true });

      // Auto-set 8-hour timer if no timer is active
      if (!sleepTimerEndTime) {
        setSleepTimer(480); // 480 minutes = 8 hours
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const { isSeekingInProgress } = get();

          // Update position and duration
          if (!isSeekingInProgress) {
            set({
              position: status.positionMillis || 0,
              duration: status.durationMillis || 0,
            });
          }

          // Handle track finish
          if (status.didJustFinish) {
            set({ isPlaying: false, position: 0 });
            const { playNext } = get();
            playNext();
          }
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  },

  pauseSound: async () => {
    // WEB: Use Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      webAudioService.pause();
      set({ isPlaying: false });
      return;
    }

    // MOBILE: Use Expo AV
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    }
  },

  stopSound: async () => {
    // WEB: Use Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      webAudioService.stop();
      set({ isPlaying: false, position: 0 });
      return;
    }

    // MOBILE: Use Expo AV
    const { sound } = get();
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error stopping sound:", error);
      } finally {
        set({ sound: null, isPlaying: false, position: 0 });
      }
    }
  },

  playNext: async () => {
    const { queue, queuePosition, repeatMode, songs, playSound } = get();

    if (queue.length === 0) return;

    let nextPosition = queuePosition + 1;

    if (repeatMode === "one") {
      nextPosition = queuePosition;
    } else if (nextPosition >= queue.length) {
      if (repeatMode === "all") {
        nextPosition = 0;
      } else {
        return;
      }
    }

    const nextSongIndex = queue[nextPosition];
    const nextSong = songs[nextSongIndex];

    if (nextSong) {
      set({ queuePosition: nextPosition });
      get().saveQueueState();
      await playSound(nextSong.audioUrl, nextSongIndex);
    }
  },

  playPrevious: async () => {
    const { queue, queuePosition, songs, playSound, position, seekToPosition } = get();

    // If current song has played more than 3 seconds, restart it instead of going to previous
    if (position > 3000) {
      await seekToPosition(0);
      return;
    }

    if (queue.length === 0 || queuePosition <= 0) return;

    const previousPosition = queuePosition - 1;
    const previousSongIndex = queue[previousPosition];
    const previousSong = songs[previousSongIndex];

    if (previousSong) {
      set({ queuePosition: previousPosition });
      get().saveQueueState();
      await playSound(previousSong.audioUrl, previousSongIndex);
    }
  },

  setQueue: (songIndices: number[], startIndex?: number) => {
    const startPos = startIndex !== undefined ? songIndices.indexOf(startIndex) : 0;
    set({
      queue: songIndices,
      queuePosition: startPos >= 0 ? startPos : 0,
      originalQueue: songIndices,
      isShuffled: false,
    });
    get().saveQueueState();
  },

  addToQueue: (songIndex: number) => {
    const { queue } = get();
    set({ queue: [...queue, songIndex] });
    get().saveQueueState();
  },

  removeFromQueue: (queueIndex: number) => {
    const { queue, queuePosition } = get();
    const newQueue = queue.filter((_, i) => i !== queueIndex);

    let newPosition = queuePosition;
    if (queueIndex < queuePosition) {
      newPosition = Math.max(0, queuePosition - 1);
    } else if (queueIndex === queuePosition && queuePosition >= newQueue.length) {
      newPosition = Math.max(0, newQueue.length - 1);
    }

    set({ queue: newQueue, queuePosition: newPosition });
    get().saveQueueState();
  },

  clearQueue: () => {
    set({ queue: [], queuePosition: -1, originalQueue: [], isShuffled: false });
    get().saveQueueState();
  },

  reorderQueue: (from: number, to: number) => {
    const { queue } = get();
    const newQueue = [...queue];
    const [removed] = newQueue.splice(from, 1);
    newQueue.splice(to, 0, removed);
    set({ queue: newQueue });
    get().saveQueueState();
  },

  playPlaylist: async (playlistName: string, shuffle = false) => {
    const { songs, playSound, setQueue } = get();

    const playlistSongs = songs
      .map((song, index) => ({ song, index }))
      .filter(({ song }) => song.playlist === playlistName);

    if (playlistSongs.length === 0) return;

    let songIndices = playlistSongs.map(({ index }) => index);

    if (shuffle) {
      songIndices = [...songIndices].sort(() => Math.random() - 0.5);
    }

    setQueue(songIndices, songIndices[0]);
    const firstSong = songs[songIndices[0]];
    await playSound(firstSong.audioUrl, songIndices[0]);

    if (shuffle) {
      set({ isShuffled: true });
    }
  },

  playCustomPlaylist: async (playlistId: string, shuffle = false) => {
    const { customPlaylists, songs, playSound, setQueue } = get();

    const playlist = customPlaylists.find((p) => p.id === playlistId);
    if (!playlist || playlist.songIndices.length === 0) return;

    let songIndices = [...playlist.songIndices];

    if (shuffle) {
      songIndices = songIndices.sort(() => Math.random() - 0.5);
    }

    setQueue(songIndices, songIndices[0]);
    const firstSong = songs[songIndices[0]];
    if (firstSong) {
      await playSound(firstSong.audioUrl, songIndices[0]);
    }

    if (shuffle) {
      set({ isShuffled: true });
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentSongIndex } = get();

    if (!isShuffled) {
      const currentSong = currentSongIndex;
      const remainingSongs = queue.filter((idx) => idx !== currentSong);
      const shuffled = remainingSongs.sort(() => Math.random() - 0.5);

      const newQueue = currentSong !== null ? [currentSong, ...shuffled] : shuffled;

      set({
        queue: newQueue,
        originalQueue: queue,
        isShuffled: true,
        queuePosition: 0,
      });
    } else {
      const currentSong = currentSongIndex;
      const newPosition = currentSong !== null ? originalQueue.indexOf(currentSong) : 0;

      set({
        queue: originalQueue,
        isShuffled: false,
        queuePosition: newPosition >= 0 ? newPosition : 0,
      });
    }
    get().saveQueueState();
  },

  setRepeatMode: (mode: RepeatMode) => {
    set({ repeatMode: mode });
  },

  // Playback Speed Control
  setPlaybackSpeed: async (speed: number) => {
    const { sound } = get();
    if (sound) {
      try {
        await sound.setRateAsync(speed, true); // true = pitch correction
        set({ playbackSpeed: speed });
      } catch (error) {
        console.error("Failed to set playback speed:", error);
      }
    } else {
      set({ playbackSpeed: speed });
    }
  },

  // Crossfade Toggle
  toggleCrossfade: () => {
    const { crossfadeEnabled } = get();
    set({ crossfadeEnabled: !crossfadeEnabled });
  },

  // Sleep Timer
  setSleepTimer: (minutes: number) => {
    // Clear existing timer if any
    if (sleepTimerTimeout) {
      clearTimeout(sleepTimerTimeout);
    }

    const endTime = Date.now() + minutes * 60 * 1000;
    set({ sleepTimerEndTime: endTime });

    sleepTimerTimeout = setTimeout(() => {
      const { pauseSound } = get();
      pauseSound();
      set({ sleepTimerEndTime: null });
      sleepTimerTimeout = null;
    }, minutes * 60 * 1000);
  },

  cancelSleepTimer: () => {
    if (sleepTimerTimeout) {
      clearTimeout(sleepTimerTimeout);
      sleepTimerTimeout = null;
    }
    set({ sleepTimerEndTime: null });
  },

  getSleepTimerRemaining: () => {
    const { sleepTimerEndTime } = get();
    if (!sleepTimerEndTime) return 0;
    const remaining = Math.max(0, sleepTimerEndTime - Date.now());
    return Math.ceil(remaining / 1000 / 60); // Return minutes
  },

  // Seek Control
  seekToPosition: async (positionMillis: number) => {
    // WEB: Use Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      webAudioService.seek(positionMillis / 1000); // Convert to seconds
      set({ position: positionMillis });
      return;
    }

    // MOBILE: Use Expo AV
    const { sound } = get();
    if (sound) {
      try {
        set({ isSeekingInProgress: true });
        await sound.setPositionAsync(positionMillis);
        set({ position: positionMillis, isSeekingInProgress: false });
      } catch (error) {
        console.error("Failed to seek:", error);
        set({ isSeekingInProgress: false });
      }
    }
  },

  // Volume Control
  setVolume: async (volume: number) => {
    const { volumeNormalizationEnabled } = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Apply normalization if enabled (reduce max volume to 0.85)
    const actualVolume = volumeNormalizationEnabled
      ? clampedVolume * 0.85
      : clampedVolume;

    // WEB: Use Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      webAudioService.setVolume(actualVolume);
      set({ volume: clampedVolume });
      return;
    }

    // MOBILE: Use Expo AV
    const { sound } = get();
    if (sound) {
      try {
        await sound.setVolumeAsync(actualVolume);
        set({ volume: clampedVolume });
      } catch (error) {
        console.error("Failed to set volume:", error);
      }
    } else {
      set({ volume: clampedVolume });
    }
  },

  toggleVolumeNormalization: async () => {
    const { volumeNormalizationEnabled, setVolume, volume } = get();
    set({ volumeNormalizationEnabled: !volumeNormalizationEnabled });
    // Re-apply current volume with new normalization setting
    await setVolume(volume);
  },

  // Queue Persistence
  saveQueueState: async () => {
    const { queue, queuePosition, currentSongIndex, isShuffled, originalQueue } = get();
    try {
      const queueState = {
        queue,
        queuePosition,
        currentSongIndex,
        isShuffled,
        originalQueue,
      };
      await AsyncStorage.setItem(QUEUE_STATE_KEY, JSON.stringify(queueState));
    } catch (error) {
      console.error("Error saving queue state:", error);
    }
  },

  loadQueueState: async () => {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STATE_KEY);
      if (data) {
        const queueState = JSON.parse(data);
        set({
          queue: queueState.queue || [],
          queuePosition: queueState.queuePosition || -1,
          currentSongIndex: queueState.currentSongIndex || null,
          isShuffled: queueState.isShuffled || false,
          originalQueue: queueState.originalQueue || [],
        });
      }
    } catch (error) {
      console.error("Error loading queue state:", error);
    }
  },

  // Equalizer Controls
  setEQPreset: async (preset: EQPreset) => {
    const presetBands: Record<EQPreset, EQBands> = {
      "off": { bass: 0, mid: 0, treble: 0 },
      "bass-boost": { bass: 6, mid: 0, treble: -2 },
      "treble-boost": { bass: -2, mid: 0, treble: 6 },
      "vocal": { bass: -2, mid: 4, treble: 2 },
      "rock": { bass: 4, mid: -2, treble: 4 },
      "jazz": { bass: 2, mid: 2, treble: 3 },
      "classical": { bass: 3, mid: -1, treble: 4 },
      "electronic": { bass: 5, mid: -1, treble: 3 },
      "custom": get().eqBands, // Keep current custom settings
    };

    const bands = presetBands[preset];
    set({ eqPreset: preset, eqBands: bands });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(EQ_SETTINGS_KEY, JSON.stringify({ preset, bands }));
    } catch (error) {
      console.error("Error saving EQ settings:", error);
    }

    // Apply to current sound
    await get().applyEQToSound();
  },

  setCustomEQ: async (bands: EQBands) => {
    set({ eqPreset: "custom", eqBands: bands });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(EQ_SETTINGS_KEY, JSON.stringify({ preset: "custom", bands }));
    } catch (error) {
      console.error("Error saving custom EQ:", error);
    }

    // Apply to current sound
    await get().applyEQToSound();
  },

  applyEQToSound: async () => {
    const { eqBands } = get();

    // WEB: Apply EQ using Web Audio API
    if (Platform.OS === 'web' && webAudioService) {
      try {
        webAudioService.setEQ(eqBands);
        console.log("✅ EQ applied on web:", eqBands);
        return;
      } catch (error) {
        console.error("Error applying web EQ:", error);
      }
    }

    // MOBILE: Expo AV doesn't have native EQ support
    // Settings are stored and will be applied if we migrate to react-native-track-player in the future
    const { sound } = get();
    if (!sound) return;

    console.log("📝 EQ settings stored for mobile (not applied - Expo AV limitation):", eqBands);
  },
}));

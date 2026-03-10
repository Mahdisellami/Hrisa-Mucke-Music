// Audio service types - platform-agnostic interface

export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

export enum RepeatMode {
  Off = 'off',
  Track = 'track',
  Queue = 'queue',
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffleEnabled: boolean;
}

export interface AudioServiceInterface {
  // Initialization
  setup(): Promise<void>;
  destroy(): Promise<void>;

  // Queue management
  setQueue(tracks: Track[], startIndex?: number): Promise<void>;
  addTrack(track: Track): Promise<void>;
  removeTrack(index: number): Promise<void>;
  clearQueue(): Promise<void>;

  // Playback control
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  skipToNext(): Promise<void>;
  skipToPrevious(): Promise<void>;
  skipToIndex(index: number): Promise<void>;
  seekTo(position: number): Promise<void>;

  // Playback options
  setRepeatMode(mode: RepeatMode): Promise<void>;
  setShuffleEnabled(enabled: boolean): Promise<void>;
  setPlaybackSpeed(speed: number): Promise<void>;

  // State getters
  getState(): Promise<PlaybackState>;
  getCurrentTrack(): Promise<Track | null>;
  getPosition(): Promise<number>;
  getDuration(): Promise<number>;
  getQueue(): Promise<Track[]>;

  // Event listeners
  onStateChange(callback: (state: PlaybackState) => void): () => void;
  onTrackChange(callback: (track: Track | null) => void): () => void;
  onPlaybackEnd(callback: () => void): () => void;
}

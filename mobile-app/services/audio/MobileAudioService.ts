// Mobile Audio Service - react-native-track-player implementation
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode as RNTPRepeatMode,
  State,
  Track as RNTPTrack,
} from 'react-native-track-player';
import type { AudioServiceInterface, Track, PlaybackState, RepeatMode } from './types';
import { RepeatMode as RepeatModeEnum } from './types';

export class MobileAudioService implements AudioServiceInterface {
  private isInitialized: boolean = false;
  private stateChangeCallbacks: Array<(state: PlaybackState) => void> = [];
  private trackChangeCallbacks: Array<(track: Track | null) => void> = [];
  private playbackEndCallbacks: Array<() => void> = [];

  async setup(): Promise<void> {
    if (this.isInitialized) return;

    await TrackPlayer.setupPlayer();

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });

    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    if (this.isInitialized) {
      await TrackPlayer.reset();
      this.isInitialized = false;
    }
  }

  // Queue management
  async setQueue(tracks: Track[], startIndex: number = 0): Promise<void> {
    await TrackPlayer.reset();
    const rnTPTracks = tracks.map(this.convertToRNTPTrack);
    await TrackPlayer.add(rnTPTracks);
    if (startIndex > 0 && startIndex < tracks.length) {
      await TrackPlayer.skip(startIndex);
    }
  }

  async addTrack(track: Track): Promise<void> {
    const rnTPTrack = this.convertToRNTPTrack(track);
    await TrackPlayer.add(rnTPTrack);
  }

  async removeTrack(index: number): Promise<void> {
    await TrackPlayer.remove(index);
  }

  async clearQueue(): Promise<void> {
    await TrackPlayer.reset();
  }

  // Playback control
  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async stop(): Promise<void> {
    await TrackPlayer.stop();
  }

  async skipToNext(): Promise<void> {
    await TrackPlayer.skipToNext();
  }

  async skipToPrevious(): Promise<void> {
    await TrackPlayer.skipToPrevious();
  }

  async skipToIndex(index: number): Promise<void> {
    await TrackPlayer.skip(index);
  }

  async seekTo(position: number): Promise<void> {
    await TrackPlayer.seekTo(position);
  }

  // Playback options
  async setRepeatMode(mode: RepeatMode): Promise<void> {
    const rnTPMode = this.convertRepeatMode(mode);
    await TrackPlayer.setRepeatMode(rnTPMode);
  }

  async setShuffleEnabled(enabled: boolean): Promise<void> {
    // react-native-track-player doesn't have built-in shuffle
    // We'll need to implement this by reordering the queue
    if (enabled) {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();

      if (currentIndex !== undefined && currentIndex !== null) {
        const currentTrack = queue[currentIndex];
        const remainingTracks = [
          ...queue.slice(0, currentIndex),
          ...queue.slice(currentIndex + 1)
        ];

        // Shuffle remaining tracks
        const shuffled = this.shuffleArray(remainingTracks);

        // Reset and add tracks: current track + shuffled remaining
        await TrackPlayer.reset();
        await TrackPlayer.add([currentTrack, ...shuffled]);
        await TrackPlayer.skip(0);
      }
    }
  }

  async setPlaybackSpeed(speed: number): Promise<void> {
    await TrackPlayer.setRate(speed);
  }

  // State getters
  async getState(): Promise<PlaybackState> {
    const state = await TrackPlayer.getPlaybackState();
    const position = await TrackPlayer.getPosition();
    const duration = await TrackPlayer.getDuration();
    const repeatMode = await TrackPlayer.getRepeatMode();
    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();

    let currentTrack: Track | null = null;
    if (currentTrackIndex !== undefined && currentTrackIndex !== null) {
      const rnTPTrack = await TrackPlayer.getTrack(currentTrackIndex);
      if (rnTPTrack) {
        currentTrack = this.convertFromRNTPTrack(rnTPTrack);
      }
    }

    return {
      isPlaying: state.state === State.Playing,
      currentTrack,
      position,
      duration,
      repeatMode: this.convertFromRNTPRepeatMode(repeatMode),
      isShuffleEnabled: false, // We'll track this separately if needed
    };
  }

  async getCurrentTrack(): Promise<Track | null> {
    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    if (currentTrackIndex !== undefined && currentTrackIndex !== null) {
      const rnTPTrack = await TrackPlayer.getTrack(currentTrackIndex);
      if (rnTPTrack) {
        return this.convertFromRNTPTrack(rnTPTrack);
      }
    }
    return null;
  }

  async getPosition(): Promise<number> {
    return await TrackPlayer.getPosition();
  }

  async getDuration(): Promise<number> {
    return await TrackPlayer.getDuration();
  }

  async getQueue(): Promise<Track[]> {
    const queue = await TrackPlayer.getQueue();
    return queue.map(this.convertFromRNTPTrack);
  }

  // Event listeners
  onStateChange(callback: (state: PlaybackState) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    const subscription = TrackPlayer.addEventListener(Event.PlaybackState, async () => {
      const state = await this.getState();
      callback(state);
    });

    return () => {
      subscription.remove();
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  onTrackChange(callback: (track: Track | null) => void): () => void {
    this.trackChangeCallbacks.push(callback);

    const subscription = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
      if (event.track) {
        const track = this.convertFromRNTPTrack(event.track as RNTPTrack);
        callback(track);
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.remove();
      const index = this.trackChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.trackChangeCallbacks.splice(index, 1);
      }
    };
  }

  onPlaybackEnd(callback: () => void): () => void {
    this.playbackEndCallbacks.push(callback);

    const subscription = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      callback();
    });

    return () => {
      subscription.remove();
      const index = this.playbackEndCallbacks.indexOf(callback);
      if (index > -1) {
        this.playbackEndCallbacks.splice(index, 1);
      }
    };
  }

  // Helper methods for conversion
  private convertToRNTPTrack(track: Track): RNTPTrack {
    return {
      id: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork,
    };
  }

  private convertFromRNTPTrack(rnTPTrack: RNTPTrack): Track {
    return {
      id: rnTPTrack.id as string,
      url: rnTPTrack.url as string,
      title: (rnTPTrack.title as string) || 'Unknown Title',
      artist: (rnTPTrack.artist as string) || 'Unknown Artist',
      album: rnTPTrack.album as string | undefined,
      artwork: rnTPTrack.artwork as string | undefined,
    };
  }

  private convertRepeatMode(mode: RepeatMode): RNTPRepeatMode {
    switch (mode) {
      case RepeatModeEnum.Off:
        return RNTPRepeatMode.Off;
      case RepeatModeEnum.Track:
        return RNTPRepeatMode.Track;
      case RepeatModeEnum.Queue:
        return RNTPRepeatMode.Queue;
      default:
        return RNTPRepeatMode.Off;
    }
  }

  private convertFromRNTPRepeatMode(mode: RNTPRepeatMode): RepeatMode {
    switch (mode) {
      case RNTPRepeatMode.Off:
        return RepeatModeEnum.Off;
      case RNTPRepeatMode.Track:
        return RepeatModeEnum.Track;
      case RNTPRepeatMode.Queue:
        return RepeatModeEnum.Queue;
      default:
        return RepeatModeEnum.Off;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

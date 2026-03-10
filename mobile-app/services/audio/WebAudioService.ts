// Web Audio Service - HTML5 Audio implementation
import type { AudioServiceInterface, Track, PlaybackState, RepeatMode } from './types';
import { RepeatMode as RepeatModeEnum } from './types';

export class WebAudioService implements AudioServiceInterface {
  private audio: HTMLAudioElement | null = null;
  private queue: Track[] = [];
  private currentIndex: number = -1;
  private repeatMode: RepeatMode = RepeatModeEnum.Off;
  private isShuffleEnabled: boolean = false;
  private playbackSpeed: number = 1.0;

  // Event listeners
  private stateChangeCallbacks: Array<(state: PlaybackState) => void> = [];
  private trackChangeCallbacks: Array<(track: Track | null) => void> = [];
  private playbackEndCallbacks: Array<() => void> = [];

  async setup(): Promise<void> {
    this.audio = new Audio();
    this.audio.addEventListener('ended', this.handleTrackEnd);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('play', this.handlePlayStateChange);
    this.audio.addEventListener('pause', this.handlePlayStateChange);
    this.audio.addEventListener('loadedmetadata', this.handleMetadataLoaded);
  }

  async destroy(): Promise<void> {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.removeEventListener('ended', this.handleTrackEnd);
      this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.audio.removeEventListener('play', this.handlePlayStateChange);
      this.audio.removeEventListener('pause', this.handlePlayStateChange);
      this.audio.removeEventListener('loadedmetadata', this.handleMetadataLoaded);
      this.audio = null;
    }
  }

  // Queue management
  async setQueue(tracks: Track[], startIndex: number = 0): Promise<void> {
    this.queue = tracks;
    this.currentIndex = startIndex;
    if (tracks.length > 0 && startIndex < tracks.length) {
      await this.loadTrack(tracks[startIndex]);
    }
  }

  async addTrack(track: Track): Promise<void> {
    this.queue.push(track);
  }

  async removeTrack(index: number): Promise<void> {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      if (index < this.currentIndex) {
        this.currentIndex--;
      } else if (index === this.currentIndex) {
        // Currently playing track was removed
        if (this.currentIndex >= this.queue.length) {
          this.currentIndex = this.queue.length - 1;
        }
        if (this.currentIndex >= 0) {
          await this.loadTrack(this.queue[this.currentIndex]);
        }
      }
    }
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    this.currentIndex = -1;
    await this.stop();
  }

  // Playback control
  async play(): Promise<void> {
    if (this.audio && this.audio.src) {
      await this.audio.play();
    }
  }

  async pause(): Promise<void> {
    if (this.audio) {
      this.audio.pause();
    }
  }

  async stop(): Promise<void> {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  async skipToNext(): Promise<void> {
    if (this.queue.length === 0) return;

    if (this.isShuffleEnabled) {
      // Random next track
      const nextIndex = Math.floor(Math.random() * this.queue.length);
      this.currentIndex = nextIndex;
    } else {
      this.currentIndex++;
      if (this.currentIndex >= this.queue.length) {
        if (this.repeatMode === RepeatModeEnum.Queue) {
          this.currentIndex = 0;
        } else {
          this.currentIndex = this.queue.length - 1;
          await this.stop();
          return;
        }
      }
    }

    await this.loadTrack(this.queue[this.currentIndex]);
    await this.play();
  }

  async skipToPrevious(): Promise<void> {
    if (this.queue.length === 0) return;

    // If more than 3 seconds have elapsed, restart current track
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    this.currentIndex--;
    if (this.currentIndex < 0) {
      if (this.repeatMode === RepeatModeEnum.Queue) {
        this.currentIndex = this.queue.length - 1;
      } else {
        this.currentIndex = 0;
      }
    }

    await this.loadTrack(this.queue[this.currentIndex]);
    await this.play();
  }

  async skipToIndex(index: number): Promise<void> {
    if (index >= 0 && index < this.queue.length) {
      this.currentIndex = index;
      await this.loadTrack(this.queue[index]);
      await this.play();
    }
  }

  async seekTo(position: number): Promise<void> {
    if (this.audio) {
      this.audio.currentTime = position;
    }
  }

  // Playback options
  async setRepeatMode(mode: RepeatMode): Promise<void> {
    this.repeatMode = mode;
    this.notifyStateChange();
  }

  async setShuffleEnabled(enabled: boolean): Promise<void> {
    this.isShuffleEnabled = enabled;
    this.notifyStateChange();
  }

  async setPlaybackSpeed(speed: number): Promise<void> {
    this.playbackSpeed = speed;
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
    this.notifyStateChange();
  }

  // State getters
  async getState(): Promise<PlaybackState> {
    return {
      isPlaying: this.audio ? !this.audio.paused : false,
      currentTrack: this.currentIndex >= 0 ? this.queue[this.currentIndex] : null,
      position: this.audio ? this.audio.currentTime : 0,
      duration: this.audio ? this.audio.duration : 0,
      repeatMode: this.repeatMode,
      isShuffleEnabled: this.isShuffleEnabled,
    };
  }

  async getCurrentTrack(): Promise<Track | null> {
    return this.currentIndex >= 0 ? this.queue[this.currentIndex] : null;
  }

  async getPosition(): Promise<number> {
    return this.audio ? this.audio.currentTime : 0;
  }

  async getDuration(): Promise<number> {
    return this.audio ? this.audio.duration || 0 : 0;
  }

  async getQueue(): Promise<Track[]> {
    return [...this.queue];
  }

  // Event listeners
  onStateChange(callback: (state: PlaybackState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  onTrackChange(callback: (track: Track | null) => void): () => void {
    this.trackChangeCallbacks.push(callback);
    return () => {
      const index = this.trackChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.trackChangeCallbacks.splice(index, 1);
      }
    };
  }

  onPlaybackEnd(callback: () => void): () => void {
    this.playbackEndCallbacks.push(callback);
    return () => {
      const index = this.playbackEndCallbacks.indexOf(callback);
      if (index > -1) {
        this.playbackEndCallbacks.splice(index, 1);
      }
    };
  }

  // Private helper methods
  private async loadTrack(track: Track): Promise<void> {
    if (!this.audio) return;

    const wasPlaying = !this.audio.paused;
    this.audio.src = track.url;
    this.audio.playbackRate = this.playbackSpeed;

    if (wasPlaying) {
      try {
        await this.audio.play();
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }

    this.notifyTrackChange(track);
    this.notifyStateChange();
  }

  private handleTrackEnd = async () => {
    if (this.repeatMode === RepeatModeEnum.Track) {
      // Repeat current track
      await this.seekTo(0);
      await this.play();
    } else {
      // Move to next track
      await this.skipToNext();
    }

    this.playbackEndCallbacks.forEach(cb => cb());
  };

  private handleTimeUpdate = () => {
    this.notifyStateChange();
  };

  private handlePlayStateChange = () => {
    this.notifyStateChange();
  };

  private handleMetadataLoaded = () => {
    this.notifyStateChange();
  };

  private async notifyStateChange(): Promise<void> {
    const state = await this.getState();
    this.stateChangeCallbacks.forEach(cb => cb(state));
  }

  private notifyTrackChange(track: Track | null): void {
    this.trackChangeCallbacks.forEach(cb => cb(track));
  }
}

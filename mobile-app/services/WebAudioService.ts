/**
 * Web Audio API service for browser-based audio playback
 * Provides EQ support and better audio control on web
 */

export interface EQBands {
  bass: number;   // -12 to +12 dB
  mid: number;    // -12 to +12 dB
  treble: number; // -12 to +12 dB
}

export class WebAudioService {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  async loadTrack(url: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Web Audio API not supported');
    }

    // Create or reuse audio element
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      // Create audio graph
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.gainNode = this.audioContext.createGain();

      // Create EQ filters
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 150;

      this.midFilter = this.audioContext.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1;

      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 4000;

      // Connect nodes: source -> bass -> mid -> treble -> gain -> destination
      this.sourceNode
        .connect(this.bassFilter)
        .connect(this.midFilter)
        .connect(this.trebleFilter)
        .connect(this.gainNode)
        .connect(this.audioContext.destination);
    }

    this.audioElement.src = url;
    await this.audioElement.load();
  }

  async play(): Promise<void> {
    if (this.audioElement) {
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.audioElement.play();
    }
  }

  pause(): void {
    this.audioElement?.pause();
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  seek(positionSeconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = positionSeconds;
    }
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  setEQ(bands: EQBands): void {
    if (this.bassFilter) {
      this.bassFilter.gain.value = bands.bass;
    }
    if (this.midFilter) {
      this.midFilter.gain.value = bands.mid;
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.value = bands.treble;
    }
  }

  onTimeUpdate(callback: (time: number, duration: number) => void): void {
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate', () => {
        callback(this.getCurrentTime(), this.getDuration());
      });
    }
  }

  onEnded(callback: () => void): void {
    if (this.audioElement) {
      this.audioElement.addEventListener('ended', callback);
    }
  }

  onError(callback: (error: Error) => void): void {
    if (this.audioElement) {
      this.audioElement.addEventListener('error', () => {
        callback(new Error('Audio playback error'));
      });
    }
  }

  destroy(): void {
    this.stop();
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.audioElement) {
      this.audioElement.remove();
      this.audioElement = null;
    }
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
  }
}

// Web-only audio service
import type { AudioServiceInterface } from './types';
import { WebAudioService } from './WebAudioService';

export * from './types';
export { WebAudioService } from './WebAudioService';

// Create singleton instance
let audioServiceInstance: AudioServiceInterface | null = null;

export const getAudioService = (): AudioServiceInterface => {
  if (!audioServiceInstance) {
    audioServiceInstance = new WebAudioService();
  }
  return audioServiceInstance;
};

// Initialize audio service on app start
export const initializeAudioService = async (): Promise<void> => {
  const service = getAudioService();
  await service.setup();
};

// Cleanup audio service
export const destroyAudioService = async (): Promise<void> => {
  if (audioServiceInstance) {
    await audioServiceInstance.destroy();
    audioServiceInstance = null;
  }
};

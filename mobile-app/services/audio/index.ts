// Platform-specific audio service selector
import { Platform } from 'react-native';
import type { AudioServiceInterface } from './types';
import { WebAudioService } from './WebAudioService';
import { MobileAudioService } from './MobileAudioService';

export * from './types';

// Create singleton instance based on platform
let audioServiceInstance: AudioServiceInterface | null = null;

export const getAudioService = (): AudioServiceInterface => {
  if (!audioServiceInstance) {
    if (Platform.OS === 'web') {
      audioServiceInstance = new WebAudioService();
    } else {
      audioServiceInstance = new MobileAudioService();
    }
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

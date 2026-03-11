import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isPlaying, playSound, pauseSound, currentSongIndex, songs } = useMusicStore();
  const { isAuthenticated, isLoading, loadStoredTokens } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Mark as mounted after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load stored tokens on app start
  useEffect(() => {
    loadStoredTokens();
  }, []);

  // Auth redirect logic
  useEffect(() => {
    // Wait for: component mounted, navigation ready, token loading complete
    if (!mounted || !navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not on auth screen, redirect to login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth screen, redirect to main app
      router.replace('/(tabs)');
    }
  }, [mounted, isAuthenticated, segments, isLoading, navigationState?.key]);

  // Space bar to play/pause (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyPress = async (event: KeyboardEvent) => {
      // Only handle space bar if not typing in an input field
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();

        if (currentSongIndex !== null) {
          if (isPlaying) {
            await pauseSound();
          } else {
            const currentSong = songs[currentSongIndex];
            if (currentSong) {
              await playSound(currentSong.audioUrl, currentSongIndex);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentSongIndex, songs, playSound, pauseSound]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

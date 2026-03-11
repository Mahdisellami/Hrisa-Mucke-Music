/**
 * Main Layout
 *
 * Wraps all main app screens with the SpotifyLayout (sidebar + bottom player)
 */

import { Slot } from 'expo-router';
import { SpotifyLayout } from '@/components/layout/SpotifyLayout';

export default function MainLayout() {
  return (
    <SpotifyLayout>
      <Slot />
    </SpotifyLayout>
  );
}

/**
 * BottomPlayer Component
 *
 * Spotify-style bottom player bar with:
 * - Progress bar at the top
 * - Song info (left)
 * - Playback controls (center)
 * - Additional controls (right)
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMusicStore } from '@/store/musicStore';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/Button';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { ProgressBar } from '../ProgressBar';

export function BottomPlayer() {
  const router = useRouter();
  const {
    currentSongIndex,
    songs,
    isPlaying,
    playSound,
    pauseSound,
    playNext,
    playPrevious,
    repeatMode,
    isShuffled,
    toggleShuffle,
    setRepeatMode,
    queue,
  } = useMusicStore();

  if (currentSongIndex === null) return null;

  const currentSong = songs[currentSongIndex];
  if (!currentSong) return null;

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pauseSound();
    } else {
      await playSound(currentSong.audioUrl, currentSongIndex);
    }
  };

  const handleRepeatToggle = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <ProgressBar />

      {/* Player Controls Row */}
      <View style={styles.playerRow}>
        {/* Song Info (Left) */}
        <Pressable
          style={styles.songInfo}
          onPress={() => router.push('/now-playing' as any)}
        >
          <View style={styles.albumArtContainer}>
            {currentSong.albumArt ? (
              <Image
                source={{ uri: currentSong.albumArt }}
                style={styles.albumArt}
              />
            ) : (
              <View style={styles.albumArtPlaceholder}>
                <Icon name="musical-note" size="sm" color={Colors.text.quaternary} />
              </View>
            )}
          </View>
          <View style={styles.songText}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>
          <View style={styles.songInfoActions}>
            <IconButton
              icon={currentSong.isFavorite ? 'heart' : 'heart-outline'}
              onPress={() => {
                // Favorite toggle logic handled by parent
                const { toggleFavorite } = useMusicStore.getState();
                if (currentSong.id) {
                  toggleFavorite(currentSong.id);
                }
              }}
              size="sm"
              active={currentSong.isFavorite}
            />
          </View>
        </Pressable>

        {/* Playback Controls (Center) */}
        <View style={styles.controls}>
          <IconButton
            icon="shuffle"
            onPress={toggleShuffle}
            size="sm"
            active={isShuffled}
          />

          <IconButton
            icon="play-skip-back"
            onPress={playPrevious}
            size="md"
          />

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size="lg"
              color={Colors.background.primary}
            />
          </TouchableOpacity>

          <IconButton
            icon="play-skip-forward"
            onPress={playNext}
            size="md"
          />

          <IconButton
            icon="repeat"
            onPress={handleRepeatToggle}
            size="sm"
            active={repeatMode !== 'off'}
            badge={repeatMode === 'one' ? '1' : undefined}
          />
        </View>

        {/* Additional Controls (Right) */}
        <View style={styles.rightControls}>
          <IconButton
            icon="list"
            onPress={() => router.push('/queue' as any)}
            size="md"
            badge={queue.length > 0 ? queue.length : undefined}
          />
          <IconButton
            icon="volume-high"
            onPress={() => {
              // Volume control can be added later
            }}
            size="md"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.background.subtle,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    minHeight: 90,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    minWidth: 200,
    maxWidth: 400,
  },
  albumArtContainer: {
    flexShrink: 0,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xs,
  },
  albumArtPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  artist: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  songInfoActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    justifyContent: 'center',
    flex: 1,
    maxWidth: 500,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    gap: Spacing.base,
    minWidth: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

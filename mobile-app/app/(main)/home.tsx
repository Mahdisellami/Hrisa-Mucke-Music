/**
 * Home Screen
 *
 * Discovery feed with personalized recommendations, daily mix, and featured content
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { useMusicStore } from '@/store/musicStore';
import { Icon } from '@/components/ui/Icon';
import {
  getRecommendationsForYou,
  getDailyMix,
  getDiscoverWeekly,
  getTrending,
  type Track,
  type TrendingTrack,
} from '@/api/endpoints';

export default function HomeScreen() {
  const router = useRouter();
  const { songs, loading: musicLoading, playSong } = useMusicStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Recommendation data
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [dailyMix, setDailyMix] = useState<Track[]>([]);
  const [discoverWeekly, setDiscoverWeekly] = useState<Track[]>([]);
  const [trending, setTrending] = useState<TrendingTrack[]>([]);

  useEffect(() => {
    setMounted(true);
    loadHomeContent();
  }, []);

  const loadHomeContent = async () => {
    setLoading(true);
    try {
      const [recsData, dailyData, weeklyData, trendingData] = await Promise.all([
        getRecommendationsForYou({ limit: 20 }).catch(() => []),
        getDailyMix(30).catch(() => []),
        getDiscoverWeekly(20).catch(() => []),
        getTrending('week', 10).catch(() => []),
      ]);

      setRecommendations(recsData);
      setDailyMix(dailyData);
      setDiscoverWeekly(weeklyData);
      setTrending(trendingData);
    } catch (error) {
      console.error('Error loading home content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPress = (track: Track) => {
    // Find track in songs or handle playing from library
    const songIndex = songs.findIndex((s) => s.id === track.id);
    if (songIndex !== -1) {
      playSong(songIndex);
    }
  };

  if (!mounted || musicLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Loading your music...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
      </View>

      {/* Quick Access - Recently Played */}
      {songs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jump back in</Text>
          <View style={styles.grid}>
            {songs.slice(0, 6).map((song, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAccessCard}
                onPress={() => playSong(index)}
              >
                <View style={styles.quickAccessArt}>
                  {song.albumArt ? (
                    <Image source={{ uri: song.albumArt }} style={styles.quickAccessImage} />
                  ) : (
                    <Icon name="musical-note" size="md" color={Colors.text.quaternary} />
                  )}
                </View>
                <Text style={styles.quickAccessTitle} numberOfLines={2}>
                  {song.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Playlists - Daily Mix & Discover Weekly */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Made For You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {/* Daily Mix */}
          {dailyMix.length > 0 && (
            <TouchableOpacity
              style={styles.playlistCard}
              onPress={() => router.push('/daily-mix' as any)}
            >
              <View style={[styles.playlistArt, { backgroundColor: Colors.accent.primary }]}>
                <Icon name="musical-notes" size="xl" color={Colors.text.primary} />
              </View>
              <Text style={styles.playlistTitle}>Daily Mix</Text>
              <Text style={styles.playlistSubtitle}>
                {dailyMix.length} tracks • Your top picks
              </Text>
            </TouchableOpacity>
          )}

          {/* Discover Weekly */}
          {discoverWeekly.length > 0 && (
            <TouchableOpacity
              style={styles.playlistCard}
              onPress={() => router.push('/discover-weekly' as any)}
            >
              <View style={[styles.playlistArt, { backgroundColor: Colors.accent.secondary }]}>
                <Icon name="sparkles" size="xl" color={Colors.text.primary} />
              </View>
              <Text style={styles.playlistTitle}>Discover Weekly</Text>
              <Text style={styles.playlistSubtitle}>
                {discoverWeekly.length} tracks • Fresh finds
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Trending Now */}
      {trending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity onPress={() => router.push('/browse' as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {trending.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingCard}
                onPress={() => handleTrackPress(item.track)}
              >
                <View style={styles.trendingRank}>
                  <Text style={styles.trendingRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.trendingTitle} numberOfLines={2}>
                  {item.track.title}
                </Text>
                <Text style={styles.trendingArtist} numberOfLines={1}>
                  {item.track.artist}
                </Text>
                <View style={styles.trendingPlays}>
                  <Icon name="play" size="xs" color={Colors.accent.primary} />
                  <Text style={styles.trendingPlaysText}>{item.recent_plays} plays</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recommended For You */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <TouchableOpacity onPress={() => router.push('/recommendations' as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          {recommendations.slice(0, 5).map((track) => (
            <TouchableOpacity
              key={track.id}
              style={styles.trackItem}
              onPress={() => handleTrackPress(track)}
            >
              <View style={styles.trackArt}>
                <Icon name="musical-note" size="md" color={Colors.text.quaternary} />
              </View>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <TouchableOpacity style={styles.trackAction}>
                <Icon name="play-circle" size="lg" color={Colors.accent.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State for New Users */}
      {loading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading personalized content...</Text>
        </View>
      )}

      {!loading &&
        songs.length === 0 &&
        recommendations.length === 0 &&
        dailyMix.length === 0 &&
        discoverWeekly.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="musical-notes" size={64} color={Colors.text.quaternary} />
            <Text style={styles.emptyTitle}>Welcome to Hrisa Music!</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding some tracks to your library to see personalized recommendations
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/browse' as any)}
            >
              <Text style={styles.emptyButtonText}>Browse Music</Text>
            </TouchableOpacity>
          </View>
        )}
    </ScrollView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingSection: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  greeting: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  seeAllText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickAccessArt: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quickAccessImage: {
    width: 48,
    height: 48,
  },
  quickAccessTitle: {
    flex: 1,
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
  },
  horizontalScroll: {
    marginTop: Spacing.md,
  },
  playlistCard: {
    width: 160,
    marginRight: Spacing.base,
  },
  playlistArt: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  playlistTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  playlistSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  trendingCard: {
    width: 140,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginRight: Spacing.base,
  },
  trendingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  trendingRankText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  trendingTitle: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  trendingArtist: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  trendingPlays: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingPlaysText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.card,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  trackAction: {
    marginLeft: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.pill,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
});

/**
 * Browse Screen
 *
 * Discover music by genres, moods, trending, and curated content
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import {
  getGenres,
  getMoods,
  getTrending,
  getNewReleases,
  type Genre,
  type Mood,
  type TrendingTrack,
  type Track,
} from '@/api/endpoints';

export default function BrowseScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [trending, setTrending] = useState<TrendingTrack[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);

  useEffect(() => {
    loadBrowseData();
  }, []);

  const loadBrowseData = async () => {
    setLoading(true);
    try {
      const [genresData, moodsData, trendingData, releasesData] = await Promise.all([
        getGenres(),
        getMoods(),
        getTrending('week', 10),
        getNewReleases(30, 10),
      ]);

      setGenres(genresData);
      setMoods(moodsData);
      setTrending(trendingData);
      setNewReleases(releasesData);
    } catch (error) {
      console.error('Error loading browse data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Loading browse content...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>Discover music by genre, mood, and more</Text>
      </View>

      {/* Trending This Week */}
      {trending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending This Week</Text>
            <TouchableOpacity onPress={() => router.push('/trending' as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {trending.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingCard}
                onPress={() => {
                  // Navigate to track or play
                }}
              >
                <View style={styles.trendingRank}>
                  <Text style={styles.trendingRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.trendingTitle} numberOfLines={1}>
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

      {/* Genres */}
      {genres.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Genres</Text>
            {genres.length > 6 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.grid}>
            {genres.slice(0, 6).map((genre, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => router.push(`/genre/${encodeURIComponent(genre.genre)}` as any)}
              >
                <View style={[styles.cardIcon, { backgroundColor: getGenreColor(index) }]}>
                  <Icon name="disc" size="lg" color={Colors.text.primary} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {genre.genre}
                </Text>
                <Text style={styles.cardSubtitle}>{genre.count} tracks</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Moods */}
      {moods.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moods</Text>
            {moods.length > 6 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.grid}>
            {moods.slice(0, 6).map((mood, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => router.push(`/mood/${encodeURIComponent(mood.mood)}` as any)}
              >
                <View style={[styles.cardIcon, { backgroundColor: getMoodColor(index) }]}>
                  <Icon name="musical-notes" size="lg" color={Colors.text.primary} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {mood.mood}
                </Text>
                <Text style={styles.cardSubtitle}>{mood.count} tracks</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* New Releases */}
      {newReleases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Releases</Text>
            <TouchableOpacity onPress={() => router.push('/new-releases' as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {newReleases.map((track) => (
              <TouchableOpacity key={track.id} style={styles.releaseCard}>
                <View style={styles.releaseArtwork}>
                  <Icon name="musical-note" size="xl" color={Colors.text.quaternary} />
                </View>
                <Text style={styles.releaseTitle} numberOfLines={2}>
                  {track.title}
                </Text>
                <Text style={styles.releaseArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {genres.length === 0 && moods.length === 0 && trending.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="musical-notes" size={64} color={Colors.text.quaternary} />
          <Text style={styles.emptyTitle}>No browse content yet</Text>
          <Text style={styles.emptySubtitle}>
            Add tracks to your library to see genres, moods, and trending content
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Helper functions for card colors
function getGenreColor(index: number): string {
  const colors = [
    '#E13300',
    '#1DB954',
    '#8E24AA',
    '#FF6F00',
    '#0091EA',
    '#D81B60',
  ];
  return colors[index % colors.length];
}

function getMoodColor(index: number): string {
  const colors = [
    '#F4511E',
    '#00ACC1',
    '#5E35B1',
    '#FDD835',
    '#43A047',
    '#E53935',
  ];
  return colors[index % colors.length];
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
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
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
    marginTop: Spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  horizontalScroll: {
    marginTop: Spacing.md,
  },
  trendingCard: {
    width: 160,
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
  releaseCard: {
    width: 140,
    marginRight: Spacing.base,
  },
  releaseArtwork: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  releaseTitle: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  releaseArtist: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
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
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

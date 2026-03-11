/**
 * Activity Feed Screen
 *
 * Social feed showing activity from followed users
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import { ActivityCard } from '@/components/social/ActivityCard';
import { getActivityFeed, type Activity } from '@/api/endpoints';
import { useAuthStore } from '@/store/authStore';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getActivityFeed(LIMIT, refresh ? 0 : offset);

      if (refresh) {
        setActivities(data);
        setOffset(LIMIT);
      } else {
        setActivities((prev) => [...prev, ...data]);
        setOffset((prev) => prev + LIMIT);
      }

      // Check if we have more data
      if (data.length < LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadFeed(true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadFeed().finally(() => setLoadingMore(false));
    }
  };

  const renderActivity = useCallback(
    ({ item, index }: { item: Activity; index: number }) => (
      <ActivityCard activity={item} index={index} />
    ),
    []
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.accent.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Icon name="people-outline" size={64} color={Colors.text.quaternary} />
        <Text style={styles.emptyTitle}>Your feed is empty</Text>
        <Text style={styles.emptySubtitle}>
          Follow other users to see their activity here
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/search' as any)}
        >
          <Icon name="search" size="sm" color={Colors.background.primary} />
          <Text style={styles.exploreButtonText}>Find Users</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity Feed</Text>
        <TouchableOpacity onPress={() => router.push(`/profile/${user?.id}` as any)}>
          <Icon name="person-circle" size="lg" color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  listContent: {
    padding: Spacing.base,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
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
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  exploreButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
});

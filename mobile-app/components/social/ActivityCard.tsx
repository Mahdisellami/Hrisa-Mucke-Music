/**
 * Activity Card Component
 *
 * Displays a single activity item in the social feed
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import type { Activity } from '@/api/endpoints';

interface ActivityCardProps {
  activity: Activity;
  index?: number;
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 50,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'favorited_track':
        return <Icon name="heart" size="md" color={Colors.accent.primary} />;
      case 'created_playlist':
        return <Icon name="add-circle" size="md" color={Colors.accent.primary} />;
      case 'added_to_playlist':
        return <Icon name="musical-notes" size="md" color={Colors.text.secondary} />;
      case 'followed_user':
        return <Icon name="person-add" size="md" color={Colors.accent.secondary} />;
      case 'shared_playlist':
        return <Icon name="share" size="md" color={Colors.accent.secondary} />;
      case 'shared_track':
        return <Icon name="share" size="md" color={Colors.accent.secondary} />;
      default:
        return <Icon name="musical-note" size="md" color={Colors.text.secondary} />;
    }
  };

  const getActivityText = () => {
    const displayName = activity.display_name || activity.username;

    switch (activity.activity_type) {
      case 'favorited_track':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> liked </Text>
            <Text style={styles.itemName}>{activity.track_title}</Text>
            {activity.track_artist && (
              <Text style={styles.activityText}> by {activity.track_artist}</Text>
            )}
          </>
        );
      case 'created_playlist':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> created playlist </Text>
            <Text style={styles.itemName}>{activity.playlist_name}</Text>
          </>
        );
      case 'added_to_playlist':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> added </Text>
            <Text style={styles.itemName}>{activity.track_title}</Text>
            <Text style={styles.activityText}> to </Text>
            <Text style={styles.itemName}>{activity.playlist_name}</Text>
          </>
        );
      case 'followed_user':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> followed </Text>
            <Text style={styles.itemName}>{activity.target_username}</Text>
          </>
        );
      case 'shared_playlist':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> shared playlist </Text>
            <Text style={styles.itemName}>{activity.playlist_name}</Text>
          </>
        );
      case 'shared_track':
        return (
          <>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.activityText}> shared </Text>
            <Text style={styles.itemName}>{activity.track_title}</Text>
          </>
        );
      default:
        return <Text style={styles.activityText}>Unknown activity</Text>;
    }
  };

  const getTimeAgo = () => {
    const now = new Date();
    const activityDate = new Date(activity.created_at);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  const handlePress = () => {
    // Navigate based on activity type
    if (activity.track_id) {
      // TODO: Navigate to track or play it
    } else if (activity.playlist_id) {
      router.push(`/playlist/${activity.playlist_id}` as any);
    } else if (activity.target_user_id) {
      router.push(`/profile/${activity.target_user_id}` as any);
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity style={styles.container} onPress={handlePress}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => router.push(`/profile/${activity.user_id}` as any)}
      >
        {activity.avatar_url ? (
          <Image source={{ uri: activity.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {activity.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {getActivityText()}
          </Text>
          <View style={styles.iconContainer}>{getActivityIcon()}</View>
        </View>
        <Text style={styles.timestamp}>{getTimeAgo()}</Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.base,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityDescription: {
    flex: 1,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  username: {
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  activityText: {
    color: Colors.text.secondary,
  },
  itemName: {
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
  },
  iconContainer: {
    marginLeft: Spacing.sm,
  },
  timestamp: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
  },
});

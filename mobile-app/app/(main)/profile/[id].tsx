/**
 * User Profile Screen
 *
 * Displays public user profile with stats, playlists, and activity feed
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import { ActivityCard } from '@/components/social/ActivityCard';
import {
  getUserProfile,
  getUserActivity,
  getUserPublicPlaylists,
  followUser,
  unfollowUser,
  isFollowingUser,
  type UserProfile,
  type Activity,
  type Playlist,
} from '@/api/endpoints';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const userId = parseInt(id, 10);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, activitiesData, playlistsData] = await Promise.all([
        getUserProfile(userId),
        getUserActivity(userId, 20).catch(() => []),
        getUserPublicPlaylists(userId).catch(() => []),
      ]);

      setProfile(profileData);
      setActivities(activitiesData);
      setPlaylists(playlistsData);

      // Check if current user follows this user
      if (!isOwnProfile) {
        const followStatus = await isFollowingUser(userId).catch(() => ({ is_following: false }));
        setIsFollowing(followStatus.is_following);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleFollowToggle = async () => {
    if (isOwnProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: profile.stats.followers - 1,
            },
          });
        }
      } else {
        await followUser(userId);
        setIsFollowing(true);
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: profile.stats.followers + 1,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="person-outline" size={64} color={Colors.text.quaternary} />
        <Text style={styles.emptyTitle}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, stats } = profile;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Icon name="arrow-back" size="md" color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        {/* Name */}
        <Text style={styles.displayName}>{user.display_name || user.username}</Text>
        <Text style={styles.username}>@{user.username}</Text>

        {/* Bio */}
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.playlists}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/profile/${userId}/followers` as any)}
          >
            <Text style={styles.statValue}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/profile/${userId}/following` as any)}
          >
            <Text style={styles.statValue}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_plays}</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
        </View>

        {/* Follow Button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <>
                <Icon
                  name={isFollowing ? 'checkmark' : 'person-add'}
                  size="sm"
                  color={isFollowing ? Colors.text.primary : Colors.background.primary}
                />
                <Text
                  style={[styles.followButtonText, isFollowing && styles.followingButtonText]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Edit Profile Button (Own Profile) */}
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/settings/profile' as any)}
          >
            <Icon name="create-outline" size="sm" color={Colors.text.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Public Playlists */}
      {playlists.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Public Playlists</Text>
            <Text style={styles.sectionCount}>{playlists.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playlistScroll}>
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => router.push(`/playlist/${playlist.id}` as any)}
              >
                <View style={styles.playlistArt}>
                  <Icon name="musical-notes" size="xl" color={Colors.text.quaternary} />
                </View>
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistInfo}>{playlist.track_count} tracks</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}

      {/* Empty States */}
      {playlists.length === 0 && activities.length === 0 && (
        <View style={styles.emptySection}>
          <Icon name="musical-notes" size={48} color={Colors.text.quaternary} />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            {isOwnProfile
              ? 'Start listening to music to see your activity here'
              : `${user.display_name || user.username} hasn't shared anything yet`}
          </Text>
        </View>
      )}
    </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
  backButton: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.base,
  },
  backButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  backIcon: {
    padding: Spacing.sm,
  },
  profileSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: 0,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.base,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  avatarText: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  displayName: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.base,
  },
  bio: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.subtle,
  },
  statValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    minWidth: 140,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.subtle,
  },
  followButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  followingButtonText: {
    color: Colors.text.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.background.subtle,
  },
  editButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  playlistScroll: {
    marginTop: Spacing.md,
  },
  playlistCard: {
    width: 140,
    marginRight: Spacing.base,
  },
  playlistArt: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  playlistName: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  playlistInfo: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

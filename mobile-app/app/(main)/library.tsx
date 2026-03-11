/**
 * Library Screen
 *
 * User's personal library with playlists, favorites, and recent plays
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { Icon } from '@/components/ui/Icon';

export default function LibraryScreen() {
  const router = useRouter();
  const { customPlaylists, songs } = useMusicStore();
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/favorites' as any)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: Colors.accent.primary }]}>
            <Icon name="heart" size="lg" color={Colors.text.primary} />
          </View>
          <View style={styles.quickLinkText}>
            <Text style={styles.quickLinkTitle}>Favorite Songs</Text>
            <Text style={styles.quickLinkSubtitle}>Your liked tracks</Text>
          </View>
          <Icon name="chevron-forward" size="md" color={Colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/history' as any)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: Colors.accent.secondary }]}>
            <Icon name="time" size="lg" color={Colors.text.primary} />
          </View>
          <View style={styles.quickLinkText}>
            <Text style={styles.quickLinkTitle}>Recently Played</Text>
            <Text style={styles.quickLinkSubtitle}>Your listening history</Text>
          </View>
          <Icon name="chevron-forward" size="md" color={Colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push(`/profile/${user?.id}` as any)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#8E24AA' }]}>
            <Icon name="person" size="lg" color={Colors.text.primary} />
          </View>
          <View style={styles.quickLinkText}>
            <Text style={styles.quickLinkTitle}>Your Profile</Text>
            <Text style={styles.quickLinkSubtitle}>View your public profile</Text>
          </View>
          <Icon name="chevron-forward" size="md" color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Playlists */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Playlists</Text>
          <TouchableOpacity onPress={() => router.push('/manage-playlists' as any)}>
            <Icon name="add-circle" size="lg" color={Colors.accent.primary} />
          </TouchableOpacity>
        </View>

        {customPlaylists && customPlaylists.length > 0 ? (
          <View style={styles.playlistGrid}>
            {customPlaylists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => router.push(`/playlist/${playlist.id}` as any)}
              >
                <View style={styles.playlistArtwork}>
                  <Icon name="musical-notes" size="xl" color={Colors.text.quaternary} />
                </View>
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistCount}>{playlist.songs?.length || 0} tracks</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="albums" size={64} color={Colors.text.quaternary} />
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptySubtext}>Create your first playlist to organize your music</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{songs.length}</Text>
            <Text style={styles.statLabel}>Total Tracks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{customPlaylists?.length || 0}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  section: {
    padding: Spacing.xl,
    paddingTop: 0,
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
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    padding: Spacing.base,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  quickLinkIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  quickLinkText: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickLinkSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  playlistCard: {
    width: '48%',
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  playlistArtwork: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background.elevated,
    borderRadius: 8,
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
  playlistCount: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.secondary,
    marginTop: Spacing.base,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.accent.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
});

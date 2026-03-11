/**
 * Sidebar Component
 *
 * Spotify-style sidebar navigation with:
 * - Main navigation (Home, Search, Library, Browse)
 * - User playlists list
 * - User profile section
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItemProps {
  icon: any;
  label: string;
  active: boolean;
  onPress: () => void;
  collapsed: boolean;
}

function NavItem({ icon, label, active, onPress, collapsed }: NavItemProps) {
  return (
    <Pressable
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
    >
      <Icon
        name={icon}
        size="md"
        color={active ? Colors.accent.primary : Colors.text.secondary}
      />
      {!collapsed && (
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { customPlaylists } = useMusicStore();
  const { user, logout } = useAuthStore();

  const navigate = (path: string) => {
    router.push(path as any);
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  return (
    <View style={[styles.container, isCollapsed && styles.collapsed]}>
      {/* Logo & Toggle */}
      <View style={styles.header}>
        {!isCollapsed && <Text style={styles.logo}>Hrisa Music</Text>}
        <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
          <Icon name="menu" size="md" color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Main Navigation */}
      <View style={styles.mainNav}>
        <NavItem
          icon="musical-notes"
          label="Home"
          active={isActive('/(main)/home')}
          onPress={() => navigate('/(main)/home')}
          collapsed={isCollapsed}
        />
        <NavItem
          icon="search"
          label="Search"
          active={isActive('/(main)/search')}
          onPress={() => navigate('/(main)/search')}
          collapsed={isCollapsed}
        />
        <NavItem
          icon="albums"
          label="Your Library"
          active={isActive('/(main)/library')}
          onPress={() => navigate('/(main)/library')}
          collapsed={isCollapsed}
        />
        <NavItem
          icon="disc"
          label="Browse"
          active={isActive('/(main)/browse')}
          onPress={() => navigate('/(main)/browse')}
          collapsed={isCollapsed}
        />
        <NavItem
          icon="people"
          label="Activity Feed"
          active={isActive('/(main)/feed')}
          onPress={() => navigate('/(main)/feed')}
          collapsed={isCollapsed}
        />
        <NavItem
          icon="settings"
          label="Settings"
          active={isActive('/(main)/settings')}
          onPress={() => navigate('/(main)/settings')}
          collapsed={isCollapsed}
        />
      </View>

      {/* Playlists Section */}
      {!isCollapsed && (
        <ScrollView style={styles.playlists} showsVerticalScrollIndicator={false}>
          <View style={styles.playlistHeader}>
            <Text style={styles.sectionTitle}>PLAYLISTS</Text>
            <TouchableOpacity onPress={() => navigate('/manage-playlists')}>
              <Icon name="add" size="sm" color={Colors.accent.primary} />
            </TouchableOpacity>
          </View>

          {customPlaylists && customPlaylists.length > 0 ? (
            customPlaylists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistItem}
                onPress={() => navigate(`/playlist/${playlist.id}`)}
              >
                <Icon name="musical-notes" size="sm" color={Colors.text.secondary} />
                <Text style={styles.playlistName} numberOfLines={1}>
                  {playlist.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No playlists yet</Text>
          )}
        </ScrollView>
      )}

      {/* User Profile Section */}
      <View style={styles.userSection}>
        <Pressable
          style={styles.userProfile}
          onPress={() => navigate(`/profile/${user?.id}`)}
        >
          <View style={styles.avatar}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          {!isCollapsed && (
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.display_name || user?.username || 'User'}
              </Text>
              {user?.email && (
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              )}
            </View>
          )}
        </Pressable>
        {!isCollapsed && (
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="ellipsis-horizontal" size="sm" color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: Colors.background.elevated,
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: Colors.background.subtle,
    height: '100%',
  },
  collapsed: {
    width: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
    minHeight: 72,
  },
  logo: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    flex: 1,
  },
  toggleButton: {
    padding: Spacing.sm,
  },
  mainNav: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  navItemActive: {
    backgroundColor: Colors.background.card,
  },
  navLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium as any,
    flex: 1,
  },
  navLabelActive: {
    color: Colors.accent.primary,
    fontWeight: Typography.fontWeight.bold as any,
  },
  playlists: {
    flex: 1,
    padding: Spacing.sm,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  playlistName: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  emptyText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.background.subtle,
    minHeight: 72,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold as any,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
  },
  userEmail: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
  },
  logoutButton: {
    padding: Spacing.sm,
  },
});

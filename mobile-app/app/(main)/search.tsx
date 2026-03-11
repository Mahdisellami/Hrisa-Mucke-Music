/**
 * Search Screen
 *
 * Search for tracks, artists, albums, playlists, and users with tabbed results
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import {
  searchTracks,
  searchArtists,
  searchAlbums,
  searchPlaylists,
  searchUsers,
  type Track,
  type Artist,
  type Album,
  type Playlist,
  type User,
} from '@/api/endpoints';
import { useMusicStore } from '@/store/musicStore';

type SearchTab = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists' | 'users';

export default function SearchScreen() {
  const router = useRouter();
  const { playSong, songs } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [loading, setLoading] = useState(false);

  // Results
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [playlistResults, setPlaylistResults] = useState<Playlist[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Clear results if query is empty
      setTrackResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setPlaylistResults([]);
      setUserResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search all categories in parallel
      const [tracks, artists, albums, playlists, users] = await Promise.all([
        searchTracks(query, { limit: 20 }),
        searchArtists(query, 10),
        searchAlbums(query, 10),
        searchPlaylists(query, true, 10),
        searchUsers(query, 10),
      ]);

      setTrackResults(tracks);
      setArtistResults(artists);
      setAlbumResults(albums);
      setPlaylistResults(playlists);
      setUserResults(users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleTrackPress = (track: Track) => {
    // Find track in songs or add it temporarily
    const songIndex = songs.findIndex((s) => s.id === track.id);
    if (songIndex !== -1) {
      playSong(songIndex);
    }
    // TODO: Handle playing track not in current library
  };

  const tabs: { key: SearchTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'tracks', label: 'Tracks', count: trackResults.length },
    { key: 'artists', label: 'Artists', count: artistResults.length },
    { key: 'albums', label: 'Albums', count: albumResults.length },
    { key: 'playlists', label: 'Playlists', count: playlistResults.length },
    { key: 'users', label: 'Users', count: userResults.length },
  ];

  const hasResults =
    trackResults.length > 0 ||
    artistResults.length > 0 ||
    albumResults.length > 0 ||
    playlistResults.length > 0 ||
    userResults.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size="md" color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for songs, artists, albums..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size="md" color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      {searchQuery.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
          </View>
        )}

        {!loading && searchQuery.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="search-outline" size={64} color={Colors.text.quaternary} />
            <Text style={styles.emptyTitle}>Search for music</Text>
            <Text style={styles.emptySubtitle}>
              Find tracks, artists, albums, playlists, and users
            </Text>
          </View>
        )}

        {!loading && searchQuery.length > 0 && !hasResults && (
          <View style={styles.emptyState}>
            <Icon name="alert-circle" size={64} color={Colors.text.quaternary} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with different keywords
            </Text>
          </View>
        )}

        {!loading && hasResults && (
          <>
            {/* Tracks */}
            {(activeTab === 'all' || activeTab === 'tracks') && trackResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tracks</Text>
                {trackResults.slice(0, activeTab === 'all' ? 5 : undefined).map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    style={styles.resultItem}
                    onPress={() => handleTrackPress(track)}
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="musical-note" size="md" color={Colors.text.secondary} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {track.artist} • {track.album}
                      </Text>
                    </View>
                    {track.genre && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{track.genre}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {activeTab === 'all' && trackResults.length > 5 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setActiveTab('tracks')}
                  >
                    <Text style={styles.showMoreText}>
                      Show all {trackResults.length} tracks
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Artists */}
            {(activeTab === 'all' || activeTab === 'artists') && artistResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Artists</Text>
                {artistResults.slice(0, activeTab === 'all' ? 3 : undefined).map((artist, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.resultItem}
                    onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}` as any)}
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="person" size="md" color={Colors.accent.primary} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle}>{artist.name}</Text>
                      <Text style={styles.resultSubtitle}>
                        {artist.track_count} {artist.track_count === 1 ? 'track' : 'tracks'}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Albums */}
            {(activeTab === 'all' || activeTab === 'albums') && albumResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Albums</Text>
                {albumResults.slice(0, activeTab === 'all' ? 3 : undefined).map((album, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.resultItem}
                    onPress={() =>
                      router.push(
                        `/album/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.album)}` as any
                      )
                    }
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="albums" size="md" color={Colors.accent.secondary} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {album.album}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {album.artist} • {album.track_count} tracks
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Playlists */}
            {(activeTab === 'all' || activeTab === 'playlists') && playlistResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Playlists</Text>
                {playlistResults.slice(0, activeTab === 'all' ? 3 : undefined).map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.resultItem}
                    onPress={() => router.push(`/playlist/${playlist.id}` as any)}
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="musical-notes" size="md" color={Colors.text.secondary} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {playlist.name}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        By {playlist.owner_username}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Users */}
            {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Users</Text>
                {userResults.slice(0, activeTab === 'all' ? 3 : undefined).map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.resultItem}
                    onPress={() => router.push(`/profile/${user.id}` as any)}
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="person-circle" size="md" color={Colors.accent.primary} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle}>{user.display_name || user.username}</Text>
                      <Text style={styles.resultSubtitle}>@{user.username}</Text>
                    </View>
                    <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
  },
  tabsContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.base,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.accent.primary,
    fontWeight: Typography.fontWeight.bold as any,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
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
  section: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  badge: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
  showMoreButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.accent.primary,
  },
});

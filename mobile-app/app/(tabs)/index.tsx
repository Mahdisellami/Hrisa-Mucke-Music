import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SearchFilter } from "@/components/SearchFilter";
import { SongCard } from "@/components/SongCard";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { PrimaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

export default function MusicScreen() {
  const {
    songs,
    loading,
    fetchSongs,
    currentSongIndex,
    searchQuery,
    filterMode,
    sortMode,
    getFilteredSongs,
    customPlaylists,
    favorites,
    recentlyPlayed,
  } = useMusicStore();
  const router = useRouter();

  useEffect(() => {
    fetchSongs();
  }, []);

  // Check if search/filter is active
  const isFiltering = searchQuery.trim() !== "" || filterMode !== "all";

  // Get filtered songs when searching/filtering - memoize to react to sortMode changes
  const filteredSongs = useMemo(() => {
    return isFiltering ? getFilteredSongs() : [];
  }, [isFiltering, searchQuery, filterMode, sortMode, songs, favorites, customPlaylists, recentlyPlayed]);

  // Group regular playlists
  const groupedSongs = songs.reduce((acc, song) => {
    const playlist = song.playlist || "unknown";
    if (!acc[playlist]) {
      acc[playlist] = [];
    }
    acc[playlist].push(song);
    return acc;
  }, {} as Record<string, any[]>);

  const regularPlaylists = Object.keys(groupedSongs).sort();

  const handlePlaylistPress = (playlistName: string) => {
    router.push(`/playlist/${encodeURIComponent(playlistName)}`);
  };

  const handleCustomPlaylistPress = (playlistId: string) => {
    router.push(`/custom-playlist/${playlistId}`);
  };

  const handleManagePlaylists = () => {
    router.push("/manage-playlists");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Music</Text>

      {/* Fetch Music Button */}
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={loading ? "Fetching..." : "Fetch Music"}
          onPress={fetchSongs}
          disabled={loading}
          loading={loading}
        />
      </View>

      {/* Search & Filter */}
      <SearchFilter />

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : isFiltering ? (
        // Show filtered song list
        <FlatList
          data={filteredSongs}
          keyExtractor={(_, index) => `filtered-${index}`}
          contentContainerStyle={{
            paddingBottom: currentSongIndex !== null ? 140 : 20,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No songs found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or filter
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const songIndex = songs.findIndex(
              (s) => s.title === item.title && s.artist === item.artist
            );
            return songIndex >= 0 ? (
              <SongCard {...item} index={songIndex} songId={item.id} />
            ) : null;
          }}
        />
      ) : (
        // Show playlists view
        <FlatList
          data={[
            ...regularPlaylists.map((name) => ({ type: "regular", name })),
            ...customPlaylists.map((p) => ({ type: "custom", ...p })),
          ]}
          keyExtractor={(item) =>
            item.type === "regular" ? `regular-${item.name}` : `custom-${item.id}`
          }
          contentContainerStyle={{
            paddingBottom: currentSongIndex !== null ? 140 : 20,
          }}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.createPlaylistButton}
              onPress={handleManagePlaylists}
            >
              <Icon name="add" size="sm" color={Colors.accent.primary} style={styles.createPlaylistIcon} />
              <Text style={styles.createPlaylistText}>
                Manage Custom Playlists
              </Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            if (item.type === "regular") {
              const playlistSongs = groupedSongs[item.name];
              return (
                <TouchableOpacity
                  style={styles.playlistCard}
                  onPress={() => handlePlaylistPress(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playlistIcon}>
                    <Text style={styles.playlistIconText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistTitle}>
                      {item.name.toUpperCase()}
                    </Text>
                    <Text style={styles.playlistCount}>
                      {playlistSongs.length}{" "}
                      {playlistSongs.length === 1 ? "song" : "songs"}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size="lg" color={Colors.text.quaternary} />
                </TouchableOpacity>
              );
            } else {
              // Custom playlist
              return (
                <TouchableOpacity
                  style={styles.playlistCard}
                  onPress={() => handleCustomPlaylistPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.playlistIcon, styles.customPlaylistIcon]}>
                    <Text style={styles.playlistIconText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistTitle}>{item.name}</Text>
                    <Text style={styles.playlistCount}>
                      {item.songIndices.length}{" "}
                      {item.songIndices.length === 1 ? "song" : "songs"}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size="lg" color={Colors.text.quaternary} />
                </TouchableOpacity>
              );
            }
          }}
        />
      )}

      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
  },
  header: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  buttonContainer: {
    marginBottom: Spacing.base,
  },
  createPlaylistButton: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    borderStyle: "dashed",
  },
  createPlaylistIcon: {
    marginRight: Spacing.sm,
  },
  createPlaylistText: {
    color: Colors.accent.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  playlistCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  playlistIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.base,
  },
  customPlaylistIcon: {
    backgroundColor: Colors.accent.secondary,
  },
  playlistIconText: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  playlistCount: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    marginTop: 64,
  },
  emptyText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    textAlign: "center",
  },
});

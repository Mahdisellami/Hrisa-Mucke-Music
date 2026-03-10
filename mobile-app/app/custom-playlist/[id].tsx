import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SongCard } from "@/components/SongCard";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SortModal } from "@/components/SortModal";
import { ShareModal } from "@/components/ShareModal";
import { sharePlaylistAsText, sharePlaylistAsM3U, sharePlaylistAsJSON } from "@/utils/shareUtils";
import { Icon } from "@/components/ui/Icon";
import { IconButton, PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

export default function CustomPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = parseInt(id);

  const {
    setQueue,
    playSound,
    currentSongIndex,
    sortMode,
    recentlyPlayed,
  } = useMusicStore();

  const {
    playlists,
    currentPlaylist,
    currentPlaylistSongs,
    isLoading,
    error,
    fetchPlaylists,
    fetchPlaylistSongs,
    removeSongFromPlaylist,
    setCurrentPlaylist,
    clearError,
  } = usePlaylistStore();

  const router = useRouter();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch playlists and current playlist songs on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchPlaylists();
      if (!isNaN(playlistId)) {
        await fetchPlaylistSongs(playlistId);
      }
    };
    loadData();
  }, [playlistId]);

  // Set current playlist when playlists are loaded
  useEffect(() => {
    if (playlists.length > 0 && !isNaN(playlistId)) {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (playlist) {
        setCurrentPlaylist(playlist);
      }
    }
  }, [playlists, playlistId]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  const playlist = playlists.find((p) => p.id === playlistId);

  if (isLoading && !playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            onPress={() => router.back()}
            size="md"
            color={Colors.text.primary}
          />
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading playlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            onPress={() => router.back()}
            size="md"
            color={Colors.text.primary}
          />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Playlist not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playlistSongs = useMemo(() => {
    let songs = currentPlaylistSongs.map((song, idx) => ({ song, index: idx }));

    // Apply sorting
    if (sortMode !== "default") {
      songs = [...songs].sort((a, b) => {
        switch (sortMode) {
          case "title":
            return a.song.title.localeCompare(b.song.title);
          case "artist":
            return a.song.artist.localeCompare(b.song.artist);
          case "album":
            const albumA = a.song.album || "";
            const albumB = b.song.album || "";
            return albumA.localeCompare(albumB);
          default:
            return 0;
        }
      });
    }

    return songs;
  }, [currentPlaylistSongs, sortMode]);

  const handlePlayAll = async () => {
    if (currentPlaylistSongs.length > 0) {
      // Set all songs as queue and play first song
      const indices = currentPlaylistSongs.map((_, idx) => idx);
      setQueue(indices, 0);
      await playSound(currentPlaylistSongs[0].url, 0);
    }
  };

  const handleShufflePlay = async () => {
    if (currentPlaylistSongs.length > 0) {
      // Shuffle songs
      const shuffled = [...currentPlaylistSongs]
        .map((song, idx) => ({ song, idx, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort);

      const shuffledIndices = shuffled.map((item) => item.idx);
      setQueue(shuffledIndices, shuffledIndices[0]);
      await playSound(shuffled[0].song.url, shuffledIndices[0]);
    }
  };

  const handleSongPress = async (index: number) => {
    const song = currentPlaylistSongs[index];
    if (song) {
      // Set queue starting from this song
      const indices = currentPlaylistSongs.map((_, idx) => idx);
      const reorderedQueue = [
        ...indices.slice(index),
        ...indices.slice(0, index),
      ];

      setQueue(reorderedQueue, index);
      await playSound(song.url, index);
    }
  };

  const handleRemoveSong = async (index: number) => {
    const song = currentPlaylistSongs[index];
    if (song && song.id) {
      try {
        await removeSongFromPlaylist(playlistId, song.id);
        Alert.alert("Success", "Song removed from playlist");
      } catch (error) {
        // Error handled by store
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={() => router.back()}
          size="md"
          color={Colors.text.primary}
        />
        <View style={styles.headerSpacer} />
        <IconButton
          icon="share-outline"
          onPress={() => setShowShareModal(true)}
          size="md"
          color={Colors.text.primary}
          style={styles.headerButton}
        />
        <IconButton
          icon="swap-vertical"
          onPress={() => setShowSortModal(true)}
          size="md"
          color={Colors.text.primary}
          style={styles.headerButton}
        />
      </View>

      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => `${item.index}`}
        contentContainerStyle={{ paddingBottom: currentSongIndex !== null ? 140 : 20 }}
        ListHeaderComponent={
          <View>
            {/* Playlist Info */}
            <View style={styles.playlistInfo}>
              <View style={styles.playlistIcon}>
                <Text style={styles.playlistIconText}>
                  {playlist.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistStats}>
                {playlistSongs.length} {playlistSongs.length === 1 ? "song" : "songs"}
              </Text>
            </View>

            {/* Action Buttons */}
            {playlistSongs.length > 0 && (
              <View style={styles.actionButtons}>
                <PrimaryButton
                  title="Play"
                  onPress={handlePlayAll}
                  icon="play"
                  style={{ flex: 1 }}
                />
                <SecondaryButton
                  title="Shuffle"
                  onPress={handleShufflePlay}
                  icon="shuffle"
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {/* Songs Header */}
            <View style={styles.songsHeader}>
              <Text style={styles.songsHeaderText}>Songs</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No songs in this playlist</Text>
            <Text style={styles.emptySubtext}>
              Long-press any song and select &quot;Add to Playlist&quot;
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.songWrapper}>
            <View style={styles.songWithRemove}>
              <View style={styles.songCardContainer}>
                <SongCard
                  title={item.song.title}
                  artist={item.song.artist}
                  album={item.song.album}
                  audioUrl={item.song.url}
                  index={item.index}
                  songId={item.song.id}
                  onPress={() => handleSongPress(item.index)}
                />
              </View>
              <IconButton
                icon="close"
                onPress={() => handleRemoveSong(item.index)}
                size="sm"
                color={Colors.accent.danger}
              />
            </View>
          </View>
        )}
      />

      <MiniPlayer />
      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} />
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={playlist.name}
        onShareText={() => sharePlaylistAsText(playlist.name, playlistSongs.map(item => item.song))}
        onShareM3U={() => sharePlaylistAsM3U(playlist.name, playlistSongs.map(item => item.song))}
        onShareJSON={() => sharePlaylistAsJSON(playlist.name, playlistSongs.map(item => item.song))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
  },
  headerSpacer: {
    flex: 1,
  },
  headerButton: {
    marginLeft: Spacing.sm,
  },
  playlistInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.base,
  },
  playlistIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.base,
  },
  playlistIconText: {
    fontSize: 64,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  playlistName: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  playlistStats: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  songsHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
  },
  songsHeaderText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  songWrapper: {
    paddingHorizontal: Spacing.base,
    paddingTop: 4,
  },
  songWithRemove: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  songCardContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.body,
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtext: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    textAlign: "center",
  },
});

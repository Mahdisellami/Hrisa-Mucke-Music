import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SongCard } from "@/components/SongCard";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SortModal } from "@/components/SortModal";
import { ShareModal } from "@/components/ShareModal";
import { sharePlaylistAsText, sharePlaylistAsM3U, sharePlaylistAsJSON } from "@/utils/shareUtils";
import { Icon } from "@/components/ui/Icon";
import { IconButton, PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

export default function PlaylistScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { songs, playPlaylist, setQueue, playSound, currentSongIndex, sortMode, recentlyPlayed } = useMusicStore();
  const router = useRouter();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Get all songs from this playlist and apply sorting
  const playlistSongs = useMemo(() => {
    let filtered = songs
      .map((song, index) => ({ song, index }))
      .filter(({ song }) => song.playlist === name);

    // Apply sorting
    if (sortMode !== "default") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortMode) {
          case "title":
            return a.song.title.localeCompare(b.song.title);
          case "artist":
            return a.song.artist.localeCompare(b.song.artist);
          case "album":
            const albumA = a.song.album || "";
            const albumB = b.song.album || "";
            return albumA.localeCompare(albumB);
          case "recent":
            const entryA = recentlyPlayed.find(e => e.songIndex === a.index);
            const entryB = recentlyPlayed.find(e => e.songIndex === b.index);
            const timeA = entryA ? entryA.playedAt : 0;
            const timeB = entryB ? entryB.playedAt : 0;
            return timeB - timeA; // Most recent first
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [songs, name, sortMode, recentlyPlayed]);

  const playlistName = name || "Unknown";

  const handlePlayAll = () => {
    playPlaylist(playlistName, false);
  };

  const handleShufflePlay = () => {
    playPlaylist(playlistName, true);
  };

  const handleSongPress = async (songIndex: number) => {
    // Create queue starting from this song
    const songIndices = playlistSongs.map(({ index }) => index);
    const startPosition = songIndices.indexOf(songIndex);

    if (startPosition >= 0) {
      // Reorder queue to start from selected song
      const reorderedQueue = [
        ...songIndices.slice(startPosition),
        ...songIndices.slice(0, startPosition),
      ];

      setQueue(reorderedQueue, songIndex);
      const song = songs[songIndex];
      await playSound(song.audioUrl, songIndex);
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
                  {playlistName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.playlistName}>{playlistName.toUpperCase()}</Text>
              <Text style={styles.playlistStats}>
                {playlistSongs.length} {playlistSongs.length === 1 ? "song" : "songs"}
              </Text>
            </View>

            {/* Action Buttons */}
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

            {/* Songs Header */}
            <View style={styles.songsHeader}>
              <Text style={styles.songsHeaderText}>Songs</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.songWrapper}>
            <SongCard
              {...item.song}
              index={item.index}
              songId={item.song.id}
              onPress={() => handleSongPress(item.index)}
            />
          </View>
        )}
      />

      <MiniPlayer />
      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} />
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={playlistName}
        onShareText={() => sharePlaylistAsText(playlistName, playlistSongs.map(item => item.song))}
        onShareM3U={() => sharePlaylistAsM3U(playlistName, playlistSongs.map(item => item.song))}
        onShareJSON={() => sharePlaylistAsJSON(playlistName, playlistSongs.map(item => item.song))}
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
    backgroundColor: Colors.accent.primary,
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
});

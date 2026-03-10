import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

export default function QueueScreen() {
  const {
    songs,
    queue,
    queuePosition,
    removeFromQueue,
    clearQueue,
    playSound,
  } = useMusicStore();

  const router = useRouter();

  const queueSongs = queue.map((songIndex, queueIndex) => ({
    ...songs[songIndex],
    songIndex,
    queueIndex,
    isCurrent: queueIndex === queuePosition,
  }));

  const handleSongPress = async (songIndex: number, queueIndex: number) => {
    const song = songs[songIndex];
    if (song) {
      await playSound(song.audioUrl, songIndex);
    }
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;

    Alert.alert(
      "Clear Queue",
      "Remove all songs from the queue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearQueue(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={() => router.back()}
          size="md"
          color={Colors.text.primary}
        />
        <Text style={styles.title}>Queue ({queue.length})</Text>
        <TouchableOpacity
          onPress={handleClearQueue}
          style={styles.clearButton}
          disabled={queue.length === 0}
        >
          <Text style={[styles.clearText, queue.length === 0 && styles.clearTextDisabled]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No songs in queue</Text>
          <Text style={styles.emptySubtext}>
            Play a song or playlist to start
          </Text>
        </View>
      ) : (
        <FlatList
          data={queueSongs}
          keyExtractor={(item) => `${item.queueIndex}-${item.songIndex}`}
          renderItem={({ item }) => (
            <View
              style={[
                styles.songContainer,
                item.isCurrent && styles.currentSongContainer,
              ]}
            >
              <TouchableOpacity
                style={styles.songInfo}
                onPress={() => handleSongPress(item.songIndex, item.queueIndex)}
              >
                {/* Album Art */}
                <View style={styles.albumArtContainer}>
                  {item.albumArt ? (
                    <Image
                      source={{ uri: item.albumArt }}
                      style={styles.albumArt}
                    />
                  ) : (
                    <View style={styles.albumArtPlaceholder}>
                      <Icon name="musical-note" size="md" color={Colors.text.quaternary} />
                    </View>
                  )}
                  {item.isCurrent && (
                    <View style={styles.nowPlayingBadge}>
                      <Icon name="play" size={10} color={Colors.text.primary} />
                    </View>
                  )}
                </View>

                {/* Song Info */}
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.songTitle,
                      item.isCurrent && styles.currentSongText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                {/* Queue Position */}
                <Text style={styles.queuePosition}>{item.queueIndex + 1}</Text>
              </TouchableOpacity>

              <IconButton
                icon="close"
                onPress={() => removeFromQueue(item.queueIndex)}
                size="sm"
                color={Colors.accent.danger}
              />
            </View>
          )}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  clearText: {
    color: Colors.accent.danger,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  clearTextDisabled: {
    color: Colors.text.quaternary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
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
  songContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginVertical: 4,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.sm,
  },
  currentSongContainer: {
    backgroundColor: Colors.background.card,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.primary,
  },
  songInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  albumArtContainer: {
    marginRight: Spacing.md,
    position: "relative",
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xs,
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background.card,
    alignItems: "center",
    justifyContent: "center",
  },
  nowPlayingBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  currentSongText: {
    color: Colors.accent.primary,
  },
  songArtist: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    marginTop: 2,
  },
  queuePosition: {
    color: Colors.text.quaternary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
});

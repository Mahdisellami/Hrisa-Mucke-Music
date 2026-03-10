import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { useMusicStore } from "@/store/musicStore";
import { useRouter } from "expo-router";
import { ProgressBar } from "./ProgressBar";
import { Icon } from "./ui/Icon";
import { IconButton } from "./ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/DesignTokens";

export const MiniPlayer: React.FC = () => {
  const {
    songs,
    currentSongIndex,
    isPlaying,
    playSound,
    pauseSound,
    playNext,
    playPrevious,
    repeatMode,
    isShuffled,
    toggleShuffle,
    setRepeatMode,
    queue,
    volume,
    setVolume,
  } = useMusicStore();

  const router = useRouter();

  if (currentSongIndex === null) return null;

  const currentSong = songs[currentSongIndex];
  if (!currentSong) return null;

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pauseSound();
    } else {
      await playSound(currentSong.audioUrl, currentSongIndex);
    }
  };

  const handleRepeatToggle = () => {
    const modes: ("off" | "one" | "all")[] = ["off", "one", "all"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  return (
    <View style={styles.container}>
      <ProgressBar />

      <View style={styles.playerContent}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          {currentSong.albumArt ? (
            <Image
              source={{ uri: currentSong.albumArt }}
              style={styles.albumArt}
            />
          ) : (
            <View style={styles.albumArtPlaceholder}>
              <Icon name="musical-note" size="sm" color={Colors.text.quaternary} />
            </View>
          )}
        </View>

        {/* Song Info */}
        <TouchableOpacity
          style={styles.songInfo}
          onPress={() => router.push("/now-playing")}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <IconButton
          icon="list"
          onPress={() => router.push("/queue")}
          size="sm"
          badge={queue.length > 0 ? queue.length : undefined}
        />

        <IconButton
          icon="shuffle"
          onPress={toggleShuffle}
          size="sm"
          active={isShuffled}
        />

        <IconButton
          icon="play-skip-back"
          onPress={playPrevious}
          size="sm"
        />

        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Icon
            name={isPlaying ? "pause" : "play"}
            size={20}
            color="#000"
          />
        </TouchableOpacity>

        <IconButton
          icon="play-skip-forward"
          onPress={playNext}
          size="sm"
        />

        <IconButton
          icon="repeat"
          onPress={handleRepeatToggle}
          size="sm"
          active={repeatMode !== "off"}
          badge={repeatMode === "one" ? "1" : undefined}
        />
      </View>

      {/* Volume Control */}
      <View style={styles.volumeContainer}>
        <Icon
          name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
          size="sm"
          color={Colors.text.secondary}
        />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={setVolume}
          minimumTrackTintColor={Colors.accent.primary}
          maximumTrackTintColor={Colors.background.subtle}
          thumbTintColor={Colors.text.primary}
        />
        <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.elevated,
    borderTopWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "column",
    gap: Spacing.sm,
    ...Shadows.large,
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  albumArtContainer: {
    width: 48,
    height: 48,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
  },
  albumArtPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: -0.2,
  },
  artist: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.caption,
    marginTop: 2,
    fontWeight: Typography.fontWeight.regular,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  playButton: {
    backgroundColor: Colors.text.primary,
    borderRadius: BorderRadius.pill,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  volumeText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    minWidth: 38,
    textAlign: "right",
  },
});

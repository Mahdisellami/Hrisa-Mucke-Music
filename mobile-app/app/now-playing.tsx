import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMusicStore } from "@/store/musicStore";
import { ProgressBar } from "@/components/ProgressBar";
import { WebSlider as Slider } from "@/components/ui/WebSlider";
import { api } from "@/api/client";
import { parseLRC, getCurrentLyricIndex, LyricLine } from "@/utils/lrcParser";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/DesignTokens";

export default function NowPlayingScreen() {
  const router = useRouter();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[] | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lineRefs = useRef<{ [key: number]: View | null }>({});
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
    volume,
    setVolume,
    position,
  } = useMusicStore();

  const currentSong = currentSongIndex !== null ? songs[currentSongIndex] : null;

  // Fetch lyrics when lyrics view is shown
  useEffect(() => {
    const fetchLyrics = async () => {
      if (showLyrics && currentSong?.lyricsPath && !lyrics && !syncedLyrics) {
        setLoadingLyrics(true);
        try {
          let lyricsText = null;
          let lrcText = null;

          // Try to fetch both .lrc and .txt
          try {
            const lrcResponse = await api.get(`/lyrics/${currentSong.lyricsPath}.lrc`, {
              responseType: 'text',
            });
            lrcText = lrcResponse.data;
          } catch (lrcError) {
            console.log("No .lrc file found");
          }

          try {
            const txtResponse = await api.get(`/lyrics/${currentSong.lyricsPath}.txt`, {
              responseType: 'text',
            });
            lyricsText = txtResponse.data;
          } catch (txtError) {
            console.log("No .txt file found");
          }

          // If we have LRC, parse it for synced lyrics
          if (lrcText) {
            const parsed = parseLRC(lrcText);
            setSyncedLyrics(parsed);
          } else if (lyricsText) {
            // Fallback to plain text
            setLyrics(lyricsText);
          }
        } catch (error) {
          console.error("Error fetching lyrics:", error);
          setLyrics(null);
          setSyncedLyrics(null);
        } finally {
          setLoadingLyrics(false);
        }
      }
    };

    fetchLyrics();
  }, [showLyrics, currentSong]);

  // Get current lyric line index
  const currentLineIndex = syncedLyrics ? getCurrentLyricIndex(syncedLyrics, position) : -1;

  // Auto-scroll to current line
  useEffect(() => {
    if (syncedLyrics && currentLineIndex >= 0 && lineRefs.current[currentLineIndex]) {
      lineRefs.current[currentLineIndex]?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 150), // Center the line
            animated: true,
          });
        },
        () => {} // Error callback
      );
    }
  }, [currentLineIndex, syncedLyrics]);

  const handlePlayPause = async () => {
    if (isPlaying && currentSong) {
      await pauseSound();
    } else if (currentSong) {
      await playSound(currentSong.audioUrl, currentSongIndex!);
    }
  };

  const handleRepeatToggle = () => {
    const modes: ("off" | "one" | "all")[] = ["off", "one", "all"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  if (currentSongIndex === null || !currentSong) {
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No song playing</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Now Playing</Text>
        <IconButton
          icon={showLyrics ? "musical-notes" : "document-text"}
          onPress={() => setShowLyrics(!showLyrics)}
          size="md"
          color={Colors.text.primary}
        />
      </View>

      {showLyrics ? (
        /* Lyrics View */
        <LinearGradient
          colors={["#6B46C1", "#553C9A", "#3E2A73"]}
          style={styles.lyricsGradient}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.lyricsContainer}
            contentContainerStyle={styles.lyricsContent}
          >
          <Text style={styles.lyricsTitle}>{currentSong.title}</Text>
          <Text style={styles.lyricsArtist}>{currentSong.artist}</Text>
          {loadingLyrics ? (
            <ActivityIndicator size="large" color="#1DB954" style={styles.loader} />
          ) : syncedLyrics ? (
            /* Synced Lyrics */
            <View style={styles.syncedLyricsContainer}>
              {syncedLyrics.map((line, index) => (
                <View
                  key={index}
                  ref={(ref) => (lineRefs.current[index] = ref)}
                  style={styles.lyricLineContainer}
                >
                  <Text
                    style={[
                      styles.lyricLine,
                      index === currentLineIndex && styles.lyricLineActive,
                      index < currentLineIndex && styles.lyricLinePast,
                    ]}
                  >
                    {line.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            /* Plain Text Lyrics */
            <Text style={styles.lyricsText}>
              {lyrics ||
                `Lyrics not available\n\nLyrics for "${currentSong.title}" were not found.\n\nRun "Populate Data" from the Music screen to fetch lyrics for all songs.`}
            </Text>
          )}
          </ScrollView>
        </LinearGradient>
      ) : (
        <>
          {/* Album Art */}
          <View style={styles.albumArtContainer}>
            {currentSong.albumArt ? (
              <Image
                source={{ uri: currentSong.albumArt }}
                style={styles.albumArt}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.albumArt}>
                <Icon name="musical-note" size="xl" color={Colors.text.quaternary} />
              </View>
            )}
          </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={2}>{currentSong.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <ProgressBar />
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        <IconButton
          icon="shuffle"
          onPress={toggleShuffle}
          size="md"
          active={isShuffled}
        />

        <IconButton
          icon="play-skip-back"
          onPress={playPrevious}
          size="lg"
          color={Colors.text.primary}
        />

        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Icon
            name={isPlaying ? "pause" : "play"}
            size={32}
            color="#000"
          />
        </TouchableOpacity>

        <IconButton
          icon="play-skip-forward"
          onPress={playNext}
          size="lg"
          color={Colors.text.primary}
        />

        <IconButton
          icon="repeat"
          onPress={handleRepeatToggle}
          size="md"
          active={repeatMode !== "off"}
          badge={repeatMode === "one" ? "1" : undefined}
        />
      </View>

          {/* Volume Control */}
          <View style={styles.volumeSection}>
            <Icon name="volume-low" size="sm" color={Colors.text.secondary} />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor={Colors.accent.primary}
              maximumTrackTintColor={Colors.text.quaternary}
              thumbTintColor={Colors.text.primary}
            />
            <Icon name="volume-high" size="sm" color={Colors.text.secondary} />
          </View>
        </>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  lyricsGradient: {
    flex: 1,
  },
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  lyricsContent: {
    paddingVertical: 32,
  },
  lyricsTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.tight,
  },
  lyricsArtist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.medium,
    textAlign: "center",
    marginBottom: 40,
  },
  lyricsText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: Typography.fontSize.h4,
    lineHeight: 32,
    textAlign: "center",
    fontWeight: Typography.fontWeight.regular,
  },
  loader: {
    marginTop: 40,
  },
  syncedLyricsContainer: {
    width: "100%",
    paddingVertical: 24,
  },
  lyricLineContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  lyricLine: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 20,
    lineHeight: 32,
    textAlign: "center",
    fontWeight: "500",
  },
  lyricLineActive: {
    color: "#000",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 36,
  },
  lyricLinePast: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  albumArtContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 32,
  },
  albumArt: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 400,
    backgroundColor: Colors.background.surface,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.large,
  },
  songInfo: {
    paddingHorizontal: 32,
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.tight,
  },
  artist: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.medium,
    textAlign: "center",
  },
  progressSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xxl,
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.base,
    marginBottom: 48,
    paddingHorizontal: Spacing.xl,
  },
  playButton: {
    backgroundColor: Colors.text.primary,
    borderRadius: BorderRadius.round,
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.medium,
  },
  volumeSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: Spacing.md,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.text.quaternary,
    fontSize: Typography.fontSize.h4,
  },
});

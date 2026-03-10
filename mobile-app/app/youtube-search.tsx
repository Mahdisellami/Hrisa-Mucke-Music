import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/api/client";
import { useMusicStore } from "@/store/musicStore";
import { Icon } from "@/components/ui/Icon";
import { IconButton, PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

interface YouTubeVideo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  url: string;
  views: number;
}

export default function YouTubeSearchScreen() {
  const router = useRouter();
  const { songs, customPlaylists } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedArtist, setEditedArtist] = useState("");
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);

  // Get both regular playlists and custom playlists (remove duplicates)
  const regularPlaylists = [...new Set(songs.map((song) => song.playlist))].sort();
  const customPlaylistNames = customPlaylists.map((p) => p.name);
  const allPlaylists = [...new Set([...regularPlaylists, ...customPlaylistNames])].sort();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.get("/search-youtube", {
        params: { query: searchQuery, max_results: 15 },
      });

      if (response.data.success) {
        setResults(response.data.results);
      } else {
        Alert.alert("Error", response.data.error || "Failed to search");
      }
    } catch (error: any) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search YouTube. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setEditedTitle(video.title);
    setEditedArtist(video.author);
    // Auto-select "music" playlist by default
    setSelectedPlaylists(["music"]);
    setShowAddModal(true);
  };

  const togglePlaylist = (playlist: string) => {
    setSelectedPlaylists((prev) =>
      prev.includes(playlist)
        ? prev.filter((p) => p !== playlist)
        : [...prev, playlist]
    );
  };

  const handleAddSong = async () => {
    if (!selectedVideo || !editedTitle.trim() || !editedArtist.trim()) {
      Alert.alert("Error", "Please fill in title and artist");
      return;
    }

    if (selectedPlaylists.length === 0) {
      Alert.alert("Error", "Please select at least one playlist");
      return;
    }

    setShowAddModal(false);
    setLoading(true);

    try {
      // Add song to all selected playlists
      const successfulPlaylists = [];
      const failedPlaylists = [];

      for (const playlist of selectedPlaylists) {
        try {
          console.log(`Adding song to ${playlist}...`);
          const response = await api.post("/add-song", null, {
            params: {
              url: selectedVideo.url,
              title: editedTitle,
              artist: editedArtist,
              playlist: playlist,
            },
          });

          console.log(`Response for ${playlist}:`, response.data);

          if (response.data.success) {
            successfulPlaylists.push(playlist);
          } else {
            console.error(`Failed for ${playlist}:`, response.data.error);
            failedPlaylists.push(playlist);
          }
        } catch (error: any) {
          console.error(`Error adding to ${playlist}:`, error.message || error);
          failedPlaylists.push(playlist);
        }
      }

      if (successfulPlaylists.length > 0) {
        Alert.alert(
          "Success",
          `Added "${editedTitle}" to ${successfulPlaylists.join(", ")}!${
            failedPlaylists.length > 0
              ? `\n\nFailed for: ${failedPlaylists.join(", ")}`
              : ""
          }\n\nRun 'Populate Data' in Tools to download. The file will be downloaded once and copied to each playlist folder.`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to add song to any playlist. Please check:\n\n1. Backend is running\n2. Check console logs for details"
        );
      }
    } catch (error: any) {
      console.error("Add song error:", error);
      const errorMsg = error.response?.data?.error || error.message || "Unknown error";
      Alert.alert(
        "Error",
        `Failed to add song: ${errorMsg}\n\nCheck if backend is running.`
      );
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Search YouTube</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs..."
          placeholderTextColor={Colors.text.quaternary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <IconButton
          icon="search"
          onPress={handleSearch}
          disabled={loading}
          size="md"
          color={Colors.text.primary}
          style={styles.searchButton}
        />
      </View>

      {/* Results */}
      {loading && results.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Searching YouTube...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results yet</Text>
          <Text style={styles.emptySubtext}>
            Search for a song to add to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.videoId}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => handleSelectVideo(item)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.resultAuthor} numberOfLines={1}>
                  {item.author}
                </Text>
                <Text style={styles.resultDuration}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
              <Icon name="add" size="lg" color={Colors.accent.primary} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Song Modal */}
      {showAddModal && selectedVideo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Song</Text>

            <Image
              source={{ uri: selectedVideo.thumbnail }}
              style={styles.modalThumbnail}
            />

            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Song title"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Artist:</Text>
            <TextInput
              style={styles.input}
              value={editedArtist}
              onChangeText={setEditedArtist}
              placeholder="Artist name"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Add to Playlists:</Text>
            <Text style={styles.sublabel}>
              Select one or more playlists. Song will be downloaded once and copied to each playlist folder.
            </Text>

            <ScrollView style={styles.playlistList} nestedScrollEnabled>
              {allPlaylists.map((p) => {
                const isSelected = selectedPlaylists.includes(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={styles.playlistItem}
                    onPress={() => togglePlaylist(p)}
                  >
                    <View style={styles.playlistItemLeft}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxActive,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.playlistItemText}>{p}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Add Song"
                onPress={handleAddSong}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    padding: Spacing.base,
    gap: Spacing.md,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background.surface,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  searchButton: {
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.body,
    marginTop: Spacing.base,
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
  listContainer: {
    padding: Spacing.base,
  },
  resultCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.card,
  },
  resultInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  resultTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  resultAuthor: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    marginBottom: 4,
  },
  resultDuration: {
    color: Colors.text.quaternary,
    fontSize: Typography.fontSize.caption,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.modal,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
    textAlign: "center",
  },
  modalThumbnail: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.base,
    backgroundColor: Colors.background.card,
  },
  label: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  input: {
    backgroundColor: Colors.background.card,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    padding: Spacing.base,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.base,
  },
  sublabel: {
    color: Colors.text.quaternary,
    fontSize: Typography.fontSize.caption,
    marginBottom: Spacing.md,
    fontStyle: "italic",
  },
  playlistList: {
    maxHeight: 200,
    marginBottom: Spacing.xl,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.subtle,
  },
  playlistItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.text.quaternary,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  checkmark: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  playlistItemText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});

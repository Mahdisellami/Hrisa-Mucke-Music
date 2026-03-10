import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { api } from "@/api/client";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { PrimaryButton, SecondaryButton, PillButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

type ActionResult = {
  success: boolean;
  message: string;
  output?: string;
};

export default function ToolsScreen() {
  const router = useRouter();
  const { populateDB, populateData, fetchSongs, songs } = useMusicStore();
  const [loadingAction, setLoadingAction] = useState<null | "db" | "data" | "addSong">(null);
  const [dbResult, setDbResult] = useState<ActionResult | null>(null);
  const [dataResult, setDataResult] = useState<ActionResult | null>(null);
  const [addSongResult, setAddSongResult] = useState<ActionResult | null>(null);

  // Add song modal state
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [songUrl, setSongUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songAlbum, setSongAlbum] = useState("");
  const [songPlaylist, setSongPlaylist] = useState("music");

  // Get unique playlists
  const playlists = [...new Set(songs.map((song) => song.playlist))].sort();

  const handlePopulateDB = async () => {
    setLoadingAction("db");
    setDbResult(null);
    try {
      await populateDB();
      setDbResult({
        success: true,
        message: "Database populated successfully!",
      });
      // Refresh songs list
      setTimeout(() => fetchSongs(), 1000);
    } catch (error: any) {
      console.error("Error populating DB:", error);
      setDbResult({
        success: false,
        message: "Failed to populate database",
        output: error?.message || String(error),
      });
      Alert.alert(
        "Error",
        "Failed to populate database. Check if the backend is running.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePopulateData = async () => {
    setLoadingAction("data");
    setDataResult(null);
    try {
      await populateData();
      setDataResult({
        success: true,
        message: "Data downloaded successfully!",
      });
      Alert.alert(
        "Success",
        "Music files have been downloaded. Don't forget to fetch music to see the updates!",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("Error populating data:", error);
      setDataResult({
        success: false,
        message: "Failed to download data",
        output: error?.message || String(error),
      });
      Alert.alert(
        "Error",
        "Failed to download music files. This may take a while - please be patient.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddSong = async () => {
    if (!songUrl.trim() || !songTitle.trim() || !songArtist.trim()) {
      Alert.alert("Error", "Please fill in URL, Title, and Artist fields");
      return;
    }

    setLoadingAction("addSong");
    setAddSongResult(null);
    setShowAddSongModal(false);

    try {
      const response = await api.post("/add-song", null, {
        params: {
          url: songUrl,
          title: songTitle,
          artist: songArtist,
          playlist: songPlaylist,
          album: songAlbum || undefined,
        },
      });

      if (response.data.success) {
        setAddSongResult({
          success: true,
          message: response.data.message,
          output: response.data.output,
        });
        // Clear form
        setSongUrl("");
        setSongTitle("");
        setSongArtist("");
        setSongAlbum("");
        setSongPlaylist("music");
        // Refresh songs list
        setTimeout(() => fetchSongs(), 1000);
        Alert.alert("Success", "Song added! Don't forget to download it using 'Populate Data'");
      } else {
        setAddSongResult({
          success: false,
          message: "Failed to add song",
          output: response.data.error,
        });
        Alert.alert("Error", response.data.error || "Failed to add song");
      }
    } catch (error: any) {
      console.error("Error adding song:", error);
      setAddSongResult({
        success: false,
        message: "Failed to add song",
        output: error?.message || String(error),
      });
      Alert.alert("Error", "Failed to add song. Check if the backend is running.");
    } finally {
      setLoadingAction(null);
    }
  };

  const renderResultCard = (result: ActionResult | null, title: string) => {
    if (!result) return null;

    return (
      <View style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultMessage}>{result.message}</Text>
        {result.output && (
          <ScrollView style={styles.outputContainer} nestedScrollEnabled>
            <Text style={styles.outputText}>{result.output}</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Tools</Text>
        <Text style={styles.description}>
          Manage your music database and downloads
        </Text>

        {/* Action Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.card, loadingAction !== null && styles.cardDisabled]}
            onPress={handlePopulateDB}
            disabled={loadingAction !== null}
          >
            {loadingAction === "db" ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <>
                <Icon name="server" size="xl" color={Colors.accent.primary} style={styles.cardIcon} />
                <Text style={styles.cardText}>Populate DB</Text>
                <Text style={styles.cardDescription}>
                  Update database from populate_db.py
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, loadingAction !== null && styles.cardDisabled]}
            onPress={handlePopulateData}
            disabled={loadingAction !== null}
          >
            {loadingAction === "data" ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <>
                <Icon name="download" size="xl" color={Colors.accent.primary} style={styles.cardIcon} />
                <Text style={styles.cardText}>Populate Data</Text>
                <Text style={styles.cardDescription}>
                  Download MP3s from YouTube
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* YouTube Search Button */}
        <TouchableOpacity
          style={styles.youtubeSearchButton}
          onPress={() => router.push("/youtube-search")}
          disabled={loadingAction !== null}
        >
          <Icon name="search" size="sm" color={Colors.accent.youtube} style={styles.buttonIcon} />
          <Text style={styles.youtubeSearchText}>Search YouTube & Add Songs</Text>
        </TouchableOpacity>

        {/* Add Song Button (Manual) */}
        <TouchableOpacity
          style={styles.addSongButton}
          onPress={() => setShowAddSongModal(true)}
          disabled={loadingAction !== null}
        >
          <Icon name="musical-note" size="sm" color={Colors.accent.secondary} style={styles.buttonIcon} />
          <Text style={styles.addSongText}>Add Song Manually (URL)</Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Icon name="information-circle" size="sm" color={Colors.text.primary} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.infoTitle}>How to use:</Text>
          </View>
          <Text style={styles.infoText}>
            1. <Text style={styles.infoBold}>Populate DB</Text>: Updates the music.json database with tracks from populate_db.py
          </Text>
          <Text style={styles.infoText}>
            2. <Text style={styles.infoBold}>Populate Data</Text>: Downloads MP3 files from YouTube (may take several minutes)
          </Text>
          <Text style={styles.infoText}>
            3. Go to the Music tab and tap &quot;Fetch Music&quot; to see your new songs
          </Text>
        </View>

        {/* Results */}
        {renderResultCard(dbResult, "Database Update")}
        {renderResultCard(dataResult, "Data Download")}
        {renderResultCard(addSongResult, "Add Song")}
      </ScrollView>

      {/* Add Song Modal */}
      <Modal
        visible={showAddSongModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSongModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addSongModal}>
            <Text style={styles.addSongModalTitle}>Add Song from YouTube</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="YouTube URL"
              placeholderTextColor="#666"
              value={songUrl}
              onChangeText={setSongUrl}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Song Title"
              placeholderTextColor="#666"
              value={songTitle}
              onChangeText={setSongTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Artist"
              placeholderTextColor="#666"
              value={songArtist}
              onChangeText={setSongArtist}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Album (optional)"
              placeholderTextColor="#666"
              value={songAlbum}
              onChangeText={setSongAlbum}
            />

            <Text style={styles.playlistLabel}>Playlist:</Text>
            <ScrollView horizontal style={styles.playlistChips}>
              {playlists.map((p) => (
                <PillButton
                  key={p}
                  title={p}
                  onPress={() => setSongPlaylist(p)}
                  active={songPlaylist === p}
                  style={{ marginRight: Spacing.sm }}
                />
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setShowAddSongModal(false)}
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  description: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  cardsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.background.surface,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardIcon: {
    marginBottom: Spacing.md,
  },
  cardText: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.body,
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: Colors.background.surface,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.primary,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.bodySmall,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent.primary,
  },
  resultCard: {
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  successCard: {
    backgroundColor: "#1e3a1e",
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.primary,
  },
  errorCard: {
    backgroundColor: "#3a1e1e",
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.danger,
  },
  resultTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  resultMessage: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.bodySmall,
    marginBottom: Spacing.sm,
  },
  outputContainer: {
    maxHeight: 150,
    backgroundColor: "#0a0a0a",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  outputText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    fontFamily: "monospace",
  },
  youtubeSearchButton: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent.youtube,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  youtubeSearchText: {
    color: Colors.accent.youtube,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  addSongButton: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent.secondary,
  },
  addSongText: {
    color: Colors.accent.secondary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: "flex-end",
  },
  addSongModal: {
    backgroundColor: Colors.background.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "90%",
  },
  addSongModalTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: Colors.background.card,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    padding: Spacing.base,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.base,
  },
  playlistLabel: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  playlistChips: {
    marginBottom: Spacing.xl,
    maxHeight: 50,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});

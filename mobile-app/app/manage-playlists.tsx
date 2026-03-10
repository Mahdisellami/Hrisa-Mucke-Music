import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { usePlaylistStore } from "@/store/playlistStore";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { IconButton, PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

export default function ManagePlaylistsScreen() {
  const {
    playlists,
    isLoading,
    error,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    clearError,
  } = usePlaylistStore();

  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [renamingPlaylist, setRenamingPlaylist] = useState<{
    id: number;
    currentName: string;
  } | null>(null);

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      try {
        await createPlaylist(newPlaylistName.trim());
        setNewPlaylistName("");
        setShowCreateModal(false);
      } catch (error) {
        // Error handled by store and shown in useEffect
      }
    }
  };

  const handleRenamePlaylist = async () => {
    if (renamingPlaylist && newPlaylistName.trim()) {
      try {
        await renamePlaylist(renamingPlaylist.id, newPlaylistName.trim());
        setNewPlaylistName("");
        setRenamingPlaylist(null);
        setShowRenameModal(false);
      } catch (error) {
        // Error handled by store and shown in useEffect
      }
    }
  };

  const handleDeletePlaylist = (playlistId: number, playlistName: string) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlistName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlaylist(playlistId);
            } catch (error) {
              // Error handled by store and shown in useEffect
            }
          },
        },
      ]
    );
  };

  const openRenameModal = (playlistId: number, currentName: string) => {
    setRenamingPlaylist({ id: playlistId, currentName });
    setNewPlaylistName(currentName);
    setShowRenameModal(true);
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
        <Text style={styles.title}>Manage Playlists</Text>
        <IconButton
          icon="add"
          onPress={() => setShowCreateModal(true)}
          size="md"
          color={Colors.accent.primary}
        />
      </View>

      {isLoading && playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading playlists...</Text>
        </View>
      ) : playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No playlists yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first playlist to get started
          </Text>
          <PrimaryButton
            title="Create Playlist"
            onPress={() => setShowCreateModal(true)}
          />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.playlistCard}>
              <TouchableOpacity
                style={styles.playlistInfo}
                onPress={() => router.push(`/custom-playlist/${item.id}`)}
              >
                <View style={styles.playlistIcon}>
                  <Text style={styles.playlistIconText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playlistDetails}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  <Text style={styles.playlistCount}>
                    {item.song_count}{" "}
                    {item.song_count === 1 ? "song" : "songs"}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actions}>
                <IconButton
                  icon="create"
                  onPress={() => openRenameModal(item.id, item.name)}
                  size="sm"
                  color={Colors.text.primary}
                />
                <IconButton
                  icon="trash"
                  onPress={() => handleDeletePlaylist(item.id, item.name)}
                  size="sm"
                  color={Colors.accent.danger}
                />
              </View>
            </View>
          )}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name..."
              placeholderTextColor="#666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setNewPlaylistName("");
                  setShowCreateModal(false);
                }}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Create"
                onPress={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Playlist Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rename Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="New playlist name..."
              placeholderTextColor="#666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setNewPlaylistName("");
                  setRenamingPlaylist(null);
                  setShowRenameModal(false);
                }}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Rename"
                onPress={handleRenamePlaylist}
                disabled={!newPlaylistName.trim()}
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
  listContainer: {
    padding: Spacing.base,
  },
  playlistCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playlistInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  playlistIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  playlistIconText: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  playlistDetails: {
    flex: 1,
  },
  playlistName: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  playlistCount: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
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
  },
  emptySubtext: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.background.surface,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    padding: Spacing.base,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});

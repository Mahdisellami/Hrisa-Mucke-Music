import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, TextInput, Alert } from "react-native";
import { AudioPlayer } from "./AudioPlayer";
import { useMusicStore } from "@/store/musicStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { Icon } from "./ui/Icon";
import { IconButton, PrimaryButton, SecondaryButton, DangerButton } from "./ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/DesignTokens";

interface SongCardProps {
  title: string;
  artist: string;
  album?: string | null;
  audioUrl: string;
  index: number;
  songId?: number;  // Optional song ID for backend operations
  onPress?: () => void;
  albumArt?: string;
}

export const SongCard: React.FC<SongCardProps> = ({
  title,
  artist,
  album,
  audioUrl,
  index,
  songId,
  onPress,
  albumArt,
}) => {
  const {
    playSound,
    pauseSound,
    isPlaying,
    currentSongIndex,
    addToQueue,
    toggleFavorite,
    isFavorite,
    deleteSong,
    updateSongMetadata,
  } = useMusicStore();

  const {
    playlists,
    addSongToPlaylist,
    fetchPlaylists,
    error: playlistError,
    clearError: clearPlaylistError,
  } = usePlaylistStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editArtist, setEditArtist] = useState(artist);
  const [editAlbum, setEditAlbum] = useState(album || "");

  // Fetch playlists when component mounts
  useEffect(() => {
    if (songId) {
      fetchPlaylists();
    }
  }, [songId]);

  // Handle playlist errors
  useEffect(() => {
    if (playlistError) {
      Alert.alert("Error", playlistError, [{ text: "OK", onPress: clearPlaylistError }]);
    }
  }, [playlistError]);

  const isCurrentSong = currentSongIndex === index;
  const isThisSongPlaying = isCurrentSong && isPlaying;
  const isSongFavorite = isFavorite(index);

  const handlePlayPause = async () => {
    if (onPress) {
      onPress();
    } else if (isThisSongPlaying) {
      await pauseSound();
    } else {
      await playSound(audioUrl, index);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(index);
    setShowMenu(false);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(index);
  };

  const handleAddToPlaylist = () => {
    setShowMenu(false);
    setShowPlaylistMenu(true);
  };

  const handlePlaylistSelect = async (playlistId: number) => {
    if (!songId) {
      Alert.alert("Error", "Cannot add song to playlist: Song ID not available");
      return;
    }

    try {
      await addSongToPlaylist(playlistId, songId);
      setShowPlaylistMenu(false);
      Alert.alert("Success", "Song added to playlist!");
    } catch (error) {
      // Error is already handled in the store and shown via useEffect
      setShowPlaylistMenu(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setEditTitle(title);
    setEditArtist(artist);
    setEditAlbum(album || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateSongMetadata(index, editTitle, editArtist, editAlbum || undefined);
      setShowEditModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update song metadata");
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (deleteFile: boolean) => {
    try {
      await deleteSong(index, deleteFile);
      setShowDeleteConfirm(false);
    } catch (error) {
      Alert.alert("Error", "Failed to delete song");
    }
  };

  const handleShare = () => {
    setShowMenu(false);
    const song = { title, artist, album, audioUrl, playlist: "", lyricsPath: "", albumArt };
    setTimeout(() => {
      console.log("Calling shareSong after menu closed");
      shareSong(song);
    }, 1000);
  };

  return (
    <>
      <View style={[
        styles.container,
        isCurrentSong && styles.currentSongContainer,
      ]}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          {albumArt ? (
            <Image source={{ uri: albumArt }} style={styles.albumArtImage} />
          ) : (
            <View style={styles.albumArtPlaceholder}>
              <Icon name="musical-note" size="md" color={Colors.text.quaternary} />
            </View>
          )}
          {isCurrentSong && (
            <View style={styles.nowPlayingBadge}>
              <Icon name="play" size={10} color={Colors.text.primary} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.infoContainer}
          onLongPress={() => setShowMenu(true)}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.artist}>{artist}</Text>
          {album && <Text style={styles.album}>{album}</Text>}
        </TouchableOpacity>

        {/* Favorite Button */}
        <IconButton
          icon={isSongFavorite ? "heart" : "heart-outline"}
          onPress={handleToggleFavorite}
          size="sm"
          color={isSongFavorite ? Colors.accent.primary : Colors.text.secondary}
          style={styles.favoriteButton}
        />

        <AudioPlayer isPlaying={isThisSongPlaying} onPlayPause={handlePlayPause} />
      </View>

      {/* Options Menu */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>{title}</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleAddToQueue}>
              <Icon name="add" size="sm" color={Colors.text.primary} style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleAddToPlaylist}>
              <Icon name="list" size="sm" color={Colors.text.primary} style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleToggleFavorite}>
              <Icon
                name={isSongFavorite ? "heart" : "heart-outline"}
                size="sm"
                color={isSongFavorite ? Colors.accent.primary : Colors.text.primary}
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>
                {isSongFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Icon name="share-outline" size="sm" color={Colors.text.primary} style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Share Song</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Icon name="create" size="sm" color={Colors.text.primary} style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Edit Song</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Icon name="trash" size="sm" color={Colors.accent.danger} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete Song</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemCancel}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuItemTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Playlist Selection Menu */}
      <Modal
        visible={showPlaylistMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlaylistMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlaylistMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Add to Playlist</Text>
            {!songId ? (
              <Text style={styles.emptyText}>
                Cannot add song: Song ID not available
              </Text>
            ) : playlists.length === 0 ? (
              <Text style={styles.emptyText}>
                No playlists yet. Create one first!
              </Text>
            ) : (
              playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.menuItem}
                  onPress={() => handlePlaylistSelect(playlist.id)}
                >
                  <Icon name="albums" size="sm" color={Colors.text.primary} style={styles.menuIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemText}>{playlist.name}</Text>
                    <Text style={styles.playlistSongCount}>
                      {playlist.song_count} {playlist.song_count === 1 ? "song" : "songs"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={styles.menuItemCancel}
              onPress={() => setShowPlaylistMenu(false)}
            >
              <Text style={styles.menuItemTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.editModalContainer}>
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Edit Song</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Song title"
                  placeholderTextColor={Colors.text.quaternary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Artist</Text>
                <TextInput
                  style={styles.textInput}
                  value={editArtist}
                  onChangeText={setEditArtist}
                  placeholder="Artist name"
                  placeholderTextColor={Colors.text.quaternary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Album</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAlbum}
                  onChangeText={setEditAlbum}
                  placeholder="Album name (optional)"
                  placeholderTextColor={Colors.text.quaternary}
                />
              </View>

              <PrimaryButton title="Save Changes" onPress={handleSaveEdit} />

              <TouchableOpacity
                style={styles.menuItemCancel}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.menuItemTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Delete Song?</Text>
              <Text style={styles.deleteWarning}>
                Are you sure you want to delete "{title}"?
              </Text>

              <SecondaryButton
                title="Delete from Database Only"
                onPress={() => handleConfirmDelete(false)}
                style={{ marginBottom: Spacing.sm }}
              />

              <DangerButton
                title="Delete Database + Files"
                onPress={() => handleConfirmDelete(true)}
                style={{ marginBottom: Spacing.sm }}
              />

              <TouchableOpacity
                style={styles.menuItemCancel}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.menuItemTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentSongContainer: {
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  albumArtContainer: {
    marginRight: Spacing.md,
    position: "relative",
  },
  albumArtImage: {
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
  infoContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.body,
  },
  artist: {
    color: Colors.text.secondary,
    marginTop: 4,
    fontSize: Typography.fontSize.bodySmall,
  },
  album: {
    color: Colors.text.tertiary,
    marginTop: 2,
    fontSize: Typography.fontSize.caption,
  },
  favoriteButton: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    width: "80%",
    maxWidth: 300,
  },
  menuTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
    textAlign: "center",
  },
  menuItem: {
    padding: Spacing.base,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuItemText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    flex: 1,
  },
  playlistSongCount: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    marginTop: 2,
  },
  menuItemCancel: {
    padding: Spacing.base,
    alignItems: "center",
  },
  menuItemTextCancel: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.body,
    textAlign: "center",
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    textAlign: "center",
    padding: Spacing.base,
  },
  deleteText: {
    color: Colors.accent.danger,
  },
  deleteWarning: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.bodySmall,
    textAlign: "center",
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  editModalContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.base,
  },
  inputLabel: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.caption,
    marginBottom: 6,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    borderWidth: 1,
    borderColor: Colors.background.subtle,
  },
});

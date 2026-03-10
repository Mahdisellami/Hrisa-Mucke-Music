import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { useMusicStore } from "@/store/musicStore";
import { SortModal } from "./SortModal";

export const SearchFilter: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    sortMode,
    songs,
    customPlaylists,
  } = useMusicStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Get unique playlists
  const playlists = [...new Set(songs.map((song) => song.playlist))].sort();

  const getFilterLabel = () => {
    if (filterMode === "all") return "All";
    if (filterMode === "favorites") return "Favorites";
    if (filterMode === "recently_played") return "Recent";

    // Check if it's a custom playlist
    const customPlaylist = customPlaylists.find((p) => p.id === filterMode);
    if (customPlaylist) return customPlaylist.name;

    // It's a regular playlist
    return filterMode;
  };

  const getSortLabel = () => {
    switch (sortMode) {
      case "title":
        return "Title";
      case "artist":
        return "Artist";
      case "album":
        return "Album";
      case "recent":
        return "Recent";
      default:
        return "Default";
    }
  };

  const handleFilterSelect = (mode: string) => {
    setFilterMode(mode);
    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Text style={styles.filterIcon}>⚙️</Text>
        <Text style={styles.filterText}>{getFilterLabel()}</Text>
      </TouchableOpacity>

      {/* Sort Button */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Text style={styles.sortIcon}>↕️</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Music</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* All */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterMode === "all" && styles.filterOptionActive,
                ]}
                onPress={() => handleFilterSelect("all")}
              >
                <Text style={styles.filterOptionText}>All Songs</Text>
                {filterMode === "all" && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              {/* Favorites */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterMode === "favorites" && styles.filterOptionActive,
                ]}
                onPress={() => handleFilterSelect("favorites")}
              >
                <Text style={styles.filterOptionText}>❤️ Favorites</Text>
                {filterMode === "favorites" && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              {/* Recently Played */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterMode === "recently_played" && styles.filterOptionActive,
                ]}
                onPress={() => handleFilterSelect("recently_played")}
              >
                <Text style={styles.filterOptionText}>🕐 Recently Played</Text>
                {filterMode === "recently_played" && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>PLAYLISTS</Text>

              {/* Regular Playlists */}
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist}
                  style={[
                    styles.filterOption,
                    filterMode === playlist && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterSelect(playlist)}
                >
                  <Text style={styles.filterOptionText}>
                    {playlist.toUpperCase()}
                  </Text>
                  {filterMode === playlist && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* Custom Playlists */}
              {customPlaylists.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>CUSTOM PLAYLISTS</Text>
                  {customPlaylists.map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      style={[
                        styles.filterOption,
                        filterMode === playlist.id && styles.filterOptionActive,
                      ]}
                      onPress={() => handleFilterSelect(playlist.id)}
                    >
                      <Text style={styles.filterOptionText}>
                        {playlist.name}
                      </Text>
                      {filterMode === playlist.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <SortModal visible={showSortModal} onClose={() => setShowSortModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
  clearIcon: {
    color: "#666",
    fontSize: 18,
    padding: 4,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 44,
    height: 44,
  },
  sortIcon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalClose: {
    color: "#999",
    fontSize: 24,
  },
  modalContent: {
    padding: 16,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: "#2a2a2a",
  },
  filterOptionText: {
    color: "white",
    fontSize: 16,
  },
  checkmark: {
    color: "#1DB954",
    fontSize: 20,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 12,
  },
});

import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useMusicStore, SortMode } from "@/store/musicStore";

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({ visible, onClose }) => {
  const { sortMode, setSortMode } = useMusicStore();

  const sortOptions: { label: string; value: SortMode; icon: string }[] = [
    { label: "Default", value: "default", icon: "📋" },
    { label: "Title", value: "title", icon: "🔤" },
    { label: "Artist", value: "artist", icon: "👤" },
    { label: "Album", value: "album", icon: "💿" },
    { label: "Recently Played", value: "recent", icon: "🕐" },
  ];

  const handleSelectSort = (mode: SortMode) => {
    setSortMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Sort By</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    sortMode === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => handleSelectSort(option.value)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      sortMode === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortMode === option.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    color: "#999",
    fontSize: 24,
    fontWeight: "300",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#1e1e1e",
  },
  optionButtonActive: {
    backgroundColor: "#1DB954",
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  optionTextActive: {
    fontWeight: "700",
  },
  checkmark: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

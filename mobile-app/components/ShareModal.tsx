import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShareText: () => void;
  onShareM3U: () => void;
  onShareJSON: () => void;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShareText,
  onShareM3U,
  onShareJSON,
  title,
}) => {
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
                <Text style={styles.title}>Share "{title}"</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  console.log("Text share button pressed");
                  onClose();
                  setTimeout(() => {
                    console.log("About to call onShareText");
                    onShareText();
                  }, 500);
                }}
              >
                <Text style={styles.optionIcon}>📝</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Share as Text</Text>
                  <Text style={styles.optionDescription}>
                    Human-readable format with song list
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  onClose();
                  setTimeout(() => onShareM3U(), 500);
                }}
              >
                <Text style={styles.optionIcon}>🎵</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Share as M3U</Text>
                  <Text style={styles.optionDescription}>
                    Standard playlist format for music players
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  onClose();
                  setTimeout(() => onShareJSON(), 500);
                }}
              >
                <Text style={styles.optionIcon}>📦</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Share as JSON</Text>
                  <Text style={styles.optionDescription}>
                    Import back into app with all metadata
                  </Text>
                </View>
              </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
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
    marginBottom: 12,
    backgroundColor: "#1e1e1e",
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    color: "#999",
    fontSize: 13,
  },
});

import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  onPlayPause,
}) => {
  return (
    <TouchableOpacity
      style={styles.playButton}
      onPress={onPlayPause}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={24}
        color="#1DB954"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1DB954",
  },
});

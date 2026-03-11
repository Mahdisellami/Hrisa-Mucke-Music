import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { WebSlider as Slider } from "@/components/ui/WebSlider";
import { useMusicStore } from "@/store/musicStore";

interface PlaybackSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlaybackSettings({ visible, onClose }: PlaybackSettingsProps) {
  const {
    playbackSpeed,
    setPlaybackSpeed,
    crossfadeEnabled,
    toggleCrossfade,
    setSleepTimer,
    cancelSleepTimer,
    sleepTimerEndTime,
    getSleepTimerRemaining,
    volume,
    setVolume,
    volumeNormalizationEnabled,
    toggleVolumeNormalization,
  } = useMusicStore();

  const [customMinutes, setCustomMinutes] = useState("");

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const timerPresets = [5, 10, 15, 30, 60]; // in minutes (for testing, keep short)

  const handleSetCustomTimer = () => {
    const minutes = parseFloat(customMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      setSleepTimer(minutes);
      setCustomMinutes("");
    }
  };

  const remainingMinutes = getSleepTimerRemaining();
  const isTimerActive = sleepTimerEndTime && remainingMinutes > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Playback Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Playback Speed */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Playback Speed: {playbackSpeed}x
              </Text>
              <View style={styles.speedButtons}>
                {speeds.map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedButton,
                      playbackSpeed === speed && styles.speedButtonActive,
                    ]}
                    onPress={() => setPlaybackSpeed(speed)}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        playbackSpeed === speed && styles.speedButtonTextActive,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Volume */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Volume: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#3a3a3a"
                thumbTintColor="#fff"
              />
              <View style={styles.row}>
                <View>
                  <Text style={styles.sectionTitle}>Volume Normalization</Text>
                  <Text style={styles.description}>
                    Reduce volume peaks for consistent loudness
                  </Text>
                </View>
                <Switch
                  value={volumeNormalizationEnabled}
                  onValueChange={toggleVolumeNormalization}
                  trackColor={{ false: "#3a3a3a", true: "#1DB954" }}
                  thumbColor={volumeNormalizationEnabled ? "#fff" : "#999"}
                />
              </View>
            </View>

            {/* Crossfade */}
            <View style={styles.section}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.sectionTitle}>Crossfade</Text>
                  <Text style={styles.description}>
                    Smooth transition between songs (2s fade)
                  </Text>
                </View>
                <Switch
                  value={crossfadeEnabled}
                  onValueChange={toggleCrossfade}
                  trackColor={{ false: "#3a3a3a", true: "#1DB954" }}
                  thumbColor={crossfadeEnabled ? "#fff" : "#999"}
                />
              </View>
            </View>

            {/* Sleep Timer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Timer</Text>
              {isTimerActive ? (
                <View style={styles.timerActive}>
                  <Text style={styles.timerActiveText}>
                    Timer Active: {remainingMinutes} min remaining
                  </Text>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelSleepTimer}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.description}>
                    Auto-pause playback after set time
                  </Text>
                  <View style={styles.timerButtons}>
                    {timerPresets.map((minutes) => (
                      <TouchableOpacity
                        key={minutes}
                        style={styles.timerButton}
                        onPress={() => setSleepTimer(minutes)}
                      >
                        <Text style={styles.timerButtonText}>{minutes} min</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Time */}
                  <View style={styles.customTimer}>
                    <Text style={styles.customTimerLabel}>
                      Custom (8 hours = 480 min):
                    </Text>
                    <View style={styles.customTimerInput}>
                      <TextInput
                        style={styles.input}
                        placeholder="Minutes"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={customMinutes}
                        onChangeText={setCustomMinutes}
                      />
                      <TouchableOpacity
                        style={styles.setButton}
                        onPress={handleSetCustomTimer}
                      >
                        <Text style={styles.setButtonText}>Set</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: "white",
    fontSize: 24,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    color: "#999",
    fontSize: 13,
    marginBottom: 12,
  },
  speedButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  speedButton: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  speedButtonActive: {
    backgroundColor: "#1DB954",
  },
  speedButtonText: {
    color: "#999",
    fontSize: 15,
    fontWeight: "600",
  },
  speedButtonTextActive: {
    color: "white",
  },
  volumeSlider: {
    width: "100%",
    height: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  timerButton: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timerButtonText: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "600",
  },
  timerActive: {
    backgroundColor: "#2a4a2a",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1DB954",
  },
  timerActiveText: {
    color: "white",
    fontSize: 15,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  customTimer: {
    marginTop: 10,
  },
  customTimerLabel: {
    color: "#999",
    fontSize: 13,
    marginBottom: 8,
  },
  customTimerInput: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "white",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  setButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
  },
  setButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

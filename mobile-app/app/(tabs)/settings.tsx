import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from "react-native";
import { WebSlider as Slider } from "@/components/ui/WebSlider";
import { useMusicStore, EQPreset, EQBands } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";

export default function SettingsScreen() {
  const {
    playbackSpeed,
    setPlaybackSpeed,
    crossfadeEnabled,
    toggleCrossfade,
    sleepTimerEndTime,
    setSleepTimer,
    eqPreset,
    eqBands,
    setEQPreset,
    setCustomEQ,
  } = useMusicStore();

  const { user, logout } = useAuthStore();

  const [showCustomEQ, setShowCustomEQ] = useState(false);
  const [customBands, setCustomBands] = useState<EQBands>(eqBands);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleSleepTimerChange = (minutes: number) => {
    if (minutes === 0) {
      setSleepTimer(null);
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      setSleepTimer(endTime);
    }
  };

  const getSleepTimerDisplay = () => {
    if (!sleepTimerEndTime) return "Off";
    const remaining = Math.max(0, sleepTimerEndTime - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes} min`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Playback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>

          {/* Crossfade/Gapless Toggle */}
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Crossfade</Text>
              <Text style={styles.settingDescription}>
                Smooth transitions between songs
              </Text>
            </View>
            <Switch
              value={crossfadeEnabled}
              onValueChange={toggleCrossfade}
              trackColor={{ false: "#3e3e3e", true: "#1DB954" }}
              thumbColor={crossfadeEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          {/* Playback Speed */}
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Playback Speed</Text>
              <Text style={styles.settingDescription}>
                Current: {playbackSpeed}x
              </Text>
            </View>
          </View>
          <View style={styles.speedButtons}>
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  playbackSpeed === speed && styles.speedButtonActive,
                ]}
                onPress={() => handleSpeedChange(speed)}
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

          {/* Sleep Timer */}
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sleep Timer</Text>
              <Text style={styles.settingDescription}>
                {getSleepTimerDisplay()}
              </Text>
            </View>
          </View>
          <View style={styles.speedButtons}>
            {[0, 5, 15, 30, 45, 60].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.speedButton,
                  (!sleepTimerEndTime && minutes === 0) ||
                  (sleepTimerEndTime && minutes > 0)
                    ? styles.speedButtonActive
                    : {},
                ]}
                onPress={() => handleSleepTimerChange(minutes)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    (!sleepTimerEndTime && minutes === 0) ||
                    (sleepTimerEndTime && minutes > 0)
                      ? styles.speedButtonTextActive
                      : {},
                  ]}
                >
                  {minutes === 0 ? "Off" : `${minutes}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audio Quality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Audio Quality</Text>
              <Text style={styles.settingDescription}>
                High (320kbps from YouTube)
              </Text>
            </View>
          </View>
        </View>

        {/* Equalizer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equalizer</Text>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>EQ Preset</Text>
              <Text style={styles.settingDescription}>
                {eqPreset === "off" ? "Off" : eqPreset.charAt(0).toUpperCase() + eqPreset.slice(1).replace("-", " ")}
              </Text>
            </View>
          </View>
          <View style={styles.speedButtons}>
            {(["off", "bass-boost", "treble-boost", "vocal", "rock", "jazz", "classical", "electronic"] as EQPreset[]).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.speedButton,
                  eqPreset === preset && styles.speedButtonActive,
                ]}
                onPress={() => setEQPreset(preset)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    eqPreset === preset && styles.speedButtonTextActive,
                  ]}
                >
                  {preset === "off" ? "Off" : preset.charAt(0).toUpperCase() + preset.slice(1).replace("-", " ")}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.speedButton,
                eqPreset === "custom" && styles.speedButtonActive,
              ]}
              onPress={() => setShowCustomEQ(true)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  eqPreset === "custom" && styles.speedButtonTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display current EQ values */}
          {eqPreset !== "off" && (
            <View style={styles.eqDisplay}>
              <Text style={styles.eqDisplayText}>
                Bass: {eqBands.bass > 0 ? "+" : ""}{eqBands.bass} dB
              </Text>
              <Text style={styles.eqDisplayText}>
                Mid: {eqBands.mid > 0 ? "+" : ""}{eqBands.mid} dB
              </Text>
              <Text style={styles.eqDisplayText}>
                Treble: {eqBands.treble > 0 ? "+" : ""}{eqBands.treble} dB
              </Text>
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Theme</Text>
              <Text style={styles.settingDescription}>
                Dark mode (Light mode coming soon)
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Cache</Text>
              <Text style={styles.settingDescription}>
                Managed automatically
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {user && (
            <View style={[styles.setting, { borderBottomWidth: 0, flexDirection: "column", alignItems: "flex-start", paddingBottom: 8 }]}>
              <Text style={styles.settingTitle}>
                {user.display_name || user.username}
              </Text>
              <Text style={styles.settingDescription}>
                {user.email}
              </Text>
              {user.is_admin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={[styles.setting, { flexDirection: "column", alignItems: "flex-start", borderBottomWidth: 0 }]}>
            <Text style={styles.aboutText}>Music Tool v1.0</Text>
            <Text style={styles.aboutSubtext}>
              A personal music player with YouTube integration
            </Text>
            <View style={styles.architectureHint}>
              <Text style={styles.architectureHintTitle}>Architecture:</Text>
              <Text style={styles.architectureHintText}>
                • Backend runs on your computer (self-hosted){"\n"}
                • Configure connection in Connection tab{"\n"}
                • Each user manages their own music library{"\n"}
                • For details, see CLAUDE.md in the project
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing for safe area */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Custom EQ Modal */}
      <Modal
        visible={showCustomEQ}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomEQ(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Equalizer</Text>

            {/* Bass Control */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Bass: {customBands.bass > 0 ? "+" : ""}{customBands.bass} dB
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={1}
                value={customBands.bass}
                onValueChange={(value) =>
                  setCustomBands({ ...customBands, bass: value })
                }
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#3e3e3e"
                thumbTintColor="#fff"
              />
            </View>

            {/* Mid Control */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Mid: {customBands.mid > 0 ? "+" : ""}{customBands.mid} dB
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={1}
                value={customBands.mid}
                onValueChange={(value) =>
                  setCustomBands({ ...customBands, mid: value })
                }
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#3e3e3e"
                thumbTintColor="#fff"
              />
            </View>

            {/* Treble Control */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Treble: {customBands.treble > 0 ? "+" : ""}{customBands.treble} dB
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={1}
                value={customBands.treble}
                onValueChange={(value) =>
                  setCustomBands({ ...customBands, treble: value })
                }
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#3e3e3e"
                thumbTintColor="#fff"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCustomEQ(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setCustomEQ(customBands);
                  setShowCustomEQ(false);
                }}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
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
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#999",
  },
  speedButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    minWidth: 60,
    alignItems: "center",
  },
  speedButtonActive: {
    backgroundColor: "#1DB954",
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  speedButtonTextActive: {
    color: "white",
  },
  aboutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
    marginBottom: 4,
  },
  aboutSubtext: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  architectureHint: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  architectureHintTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1DB954",
    marginBottom: 6,
  },
  architectureHintText: {
    fontSize: 12,
    color: "#b3b3b3",
    lineHeight: 18,
  },
  eqDisplay: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  eqDisplayText: {
    fontSize: 13,
    color: "#1DB954",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#282828",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 24,
    textAlign: "center",
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#1DB954",
  },
  modalButtonSecondary: {
    backgroundColor: "#3e3e3e",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  adminBadge: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

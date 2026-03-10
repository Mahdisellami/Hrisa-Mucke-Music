import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/api/client";
import { Icon } from "@/components/ui/Icon";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/DesignTokens";

const BACKEND_URL_KEY = "@backend_url";

export default function ConnectionScreen() {
  const [backendUrl, setBackendUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "failed">("unknown");

  useEffect(() => {
    loadBackendUrl();
  }, []);

  const loadBackendUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(BACKEND_URL_KEY);
      if (savedUrl) {
        setBackendUrl(savedUrl);
        // Test connection on load
        testConnection(savedUrl);
      } else {
        // Default to current hardcoded value
        setBackendUrl("http://192.168.2.155:8000");
      }
    } catch (error) {
      console.error("Error loading backend URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (url: string) => {
    setIsTesting(true);
    setConnectionStatus("unknown");

    try {
      // Test the connection
      const response = await fetch(`${url}/music`, {
        method: "GET",
        timeout: 5000,
      } as any);

      if (response.ok) {
        setConnectionStatus("connected");
        return true;
      } else {
        setConnectionStatus("failed");
        return false;
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("failed");
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate URL format
    if (!backendUrl.trim()) {
      Alert.alert("Error", "Please enter a backend URL");
      return;
    }

    if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
      Alert.alert("Error", "URL must start with http:// or https://");
      return;
    }

    // Remove trailing slash if present
    const cleanUrl = backendUrl.trim().replace(/\/$/, "");

    // Test connection first
    const isConnected = await testConnection(cleanUrl);

    if (isConnected) {
      try {
        // Save to AsyncStorage
        await AsyncStorage.setItem(BACKEND_URL_KEY, cleanUrl);

        // Update API client
        api.defaults.baseURL = cleanUrl;

        Alert.alert(
          "Success",
          "Backend URL saved and connected successfully!\n\nPlease restart the app for full effect.",
          [{ text: "OK" }]
        );
      } catch (error) {
        Alert.alert("Error", "Failed to save backend URL");
        console.error("Error saving backend URL:", error);
      }
    } else {
      Alert.alert(
        "Connection Failed",
        "Could not connect to backend. Do you want to save anyway?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save Anyway",
            onPress: async () => {
              try {
                await AsyncStorage.setItem(BACKEND_URL_KEY, cleanUrl);
                api.defaults.baseURL = cleanUrl;
                Alert.alert("Saved", "Backend URL saved. Check connection and restart app.");
              } catch (error) {
                Alert.alert("Error", "Failed to save backend URL");
              }
            },
          },
        ]
      );
    }
  };

  const handleTest = () => {
    const cleanUrl = backendUrl.trim().replace(/\/$/, "");
    testConnection(cleanUrl);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Default",
      "Reset to http://192.168.2.155:8000?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setBackendUrl("http://192.168.2.155:8000");
            setConnectionStatus("unknown");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Backend Connection</Text>
        <Text style={styles.subtitle}>
          Configure your music backend server
        </Text>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          {isTesting ? (
            <View style={styles.statusBadge}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusTextTesting}>Testing...</Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                connectionStatus === "connected" && styles.statusConnected,
                connectionStatus === "failed" && styles.statusFailed,
              ]}
            >
              {connectionStatus === "connected" && (
                <>
                  <Icon name="checkmark-circle" size="sm" color={Colors.text.primary} />
                  <Text style={styles.statusTextConnected}> Connected</Text>
                </>
              )}
              {connectionStatus === "failed" && (
                <>
                  <Icon name="close-circle" size="sm" color={Colors.text.primary} />
                  <Text style={styles.statusTextFailed}> Failed</Text>
                </>
              )}
              {connectionStatus === "unknown" && (
                <>
                  <Icon name="ellipse-outline" size="sm" color={Colors.text.tertiary} />
                  <Text style={styles.statusText}> Unknown</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* URL Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Enter your computer's IP address and port
          </Text>
        </View>

        {/* Architecture Overview */}
        <View style={[styles.instructionsBox, { borderLeftColor: "#00A8E8" }]}>
          <Text style={styles.instructionsTitle}>🏗️ How This Works:</Text>
          <Text style={styles.instructionsText}>
            This app requires a backend server running on your computer:{"\n\n"}
            • Music files are stored on your computer{"\n"}
            • Backend serves songs to your phone{"\n"}
            • App and backend must be on the same Wi-Fi{"\n"}
            {"\n"}
            Start backend: <Text style={styles.code}>docker-compose up</Text>
            {"\n\n"}
            <Text style={{ color: "#666", fontSize: 12 }}>
              See CLAUDE.md for architecture details
            </Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📱 How to find your IP:</Text>
          <Text style={styles.instructionsText}>
            On your computer, run:{"\n"}
            <Text style={styles.code}>make network-ip</Text>
            {"\n\n"}
            Or manually check:{"\n"}
            • Mac: System Settings → Network{"\n"}
            • Linux: ip addr or ifconfig{"\n"}
            • Windows: ipconfig
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <SecondaryButton
            title={isTesting ? "Testing..." : "Test"}
            onPress={handleTest}
            disabled={isTesting}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            title="Save"
            onPress={handleSave}
            disabled={isTesting}
            style={{ flex: 1 }}
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xxl,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    padding: Spacing.base,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.md,
  },
  statusLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.background.subtle,
  },
  statusConnected: {
    backgroundColor: Colors.accent.primary,
  },
  statusFailed: {
    backgroundColor: Colors.accent.danger,
  },
  statusText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
  },
  statusTextConnected: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusTextFailed: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusTextTesting: {
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.base,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.background.subtle,
  },
  hint: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.quaternary,
    marginTop: Spacing.sm,
  },
  instructionsBox: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.primary,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  instructionsText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  code: {
    fontFamily: "monospace",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    color: Colors.accent.primary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  resetButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.tertiary,
    textDecorationLine: "underline",
  },
});
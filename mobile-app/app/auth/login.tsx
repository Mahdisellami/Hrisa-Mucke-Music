import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { DesignTokens } from "@/constants/DesignTokens";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    try {
      await login(username.trim(), password);
      // Navigate to main app on successful login
      router.replace("/(tabs)");
    } catch (err) {
      // Error is already set in store
      Alert.alert("Login Failed", error || "Invalid username or password");
    }
  };

  const handleRegister = () => {
    clearError();
    router.push("/auth/register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Music Tool</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={DesignTokens.colors.background} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing.xxxl,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: DesignTokens.colors.accent,
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: DesignTokens.colors.textSecondary,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DesignTokens.colors.textPrimary,
    marginBottom: DesignTokens.spacing.sm,
  },
  input: {
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.medium,
    padding: DesignTokens.spacing.base,
    fontSize: 16,
    color: DesignTokens.colors.textPrimary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  errorContainer: {
    backgroundColor: `${DesignTokens.colors.error}20`,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.medium,
    marginBottom: DesignTokens.spacing.base,
    borderWidth: 1,
    borderColor: DesignTokens.colors.error,
  },
  errorText: {
    color: DesignTokens.colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: DesignTokens.colors.accent,
    borderRadius: DesignTokens.borderRadius.medium,
    padding: DesignTokens.spacing.base,
    alignItems: "center",
    marginTop: DesignTokens.spacing.base,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: DesignTokens.colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: DesignTokens.spacing.lg,
  },
  registerText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: DesignTokens.colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});

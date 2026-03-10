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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      await register(
        username.trim(),
        email.trim(),
        password,
        displayName.trim() || undefined
      );
      // Navigate to main app on successful registration
      router.replace("/(tabs)");
    } catch (err) {
      // Error is already set in store
      Alert.alert("Registration Failed", error || "Could not create account");
    }
  };

  const handleBackToLogin = () => {
    clearError();
    router.back();
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Username <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirm Password <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={DesignTokens.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onSubmitEditing={handleRegister}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={DesignTokens.colors.background} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
                <Text style={styles.loginLink}>Sign In</Text>
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
    paddingVertical: DesignTokens.spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing.xxl,
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
    marginBottom: DesignTokens.spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DesignTokens.colors.textPrimary,
    marginBottom: DesignTokens.spacing.sm,
  },
  required: {
    color: DesignTokens.colors.error,
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
    marginTop: DesignTokens.spacing.base,
    marginBottom: DesignTokens.spacing.base,
    borderWidth: 1,
    borderColor: DesignTokens.colors.error,
  },
  errorText: {
    color: DesignTokens.colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  registerButton: {
    backgroundColor: DesignTokens.colors.accent,
    borderRadius: DesignTokens.borderRadius.medium,
    padding: DesignTokens.spacing.base,
    alignItems: "center",
    marginTop: DesignTokens.spacing.base,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: DesignTokens.colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: DesignTokens.spacing.lg,
  },
  loginText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: DesignTokens.colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});

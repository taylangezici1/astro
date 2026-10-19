import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { describeError } from "@/lib/errors";

export default function LoginScreen() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { login } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t.auth.login.errorMissingFields);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t.auth.login.errorInvalid);
      } else {
        setError(describeError(err, t));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.eyebrow}>{t.home.eyebrow}</ThemedText>
            <ThemedText style={styles.title}>{t.auth.login.title}</ThemedText>
            <ThemedText style={styles.tagline}>{t.auth.login.tagline}</ThemedText>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t.auth.login.emailLabel}
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.login.emailPlaceholder}
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t.auth.login.passwordLabel}
              </ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.login.passwordPlaceholder}
                placeholderTextColor={theme.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}>
              {loading ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {t.auth.login.submit}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace("/(auth)/signup" as never)}
              style={styles.switch}>
              <ThemedText style={styles.switchText}>
                {t.auth.login.switchToSignup}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    scroll: {
      padding: 20,
      gap: 20,
      paddingBottom: 64,
    },
    header: {
      paddingTop: 24,
      gap: 4,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.accent,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: 36,
      color: theme.text,
      fontFamily: Fonts?.rounded,
    },
    tagline: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: theme.muted,
    },
    card: {
      gap: 16,
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    field: { gap: 6 },
    label: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.muted,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.inputBackground,
      color: theme.text,
      fontSize: 15,
    },
    errorBanner: {
      backgroundColor: theme.danger + "22",
      borderWidth: 1,
      borderColor: theme.danger + "55",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    errorText: { color: theme.danger, fontSize: 13 },
    button: {
      backgroundColor: theme.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
      shadowColor: theme.accent,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    buttonDisabled: { opacity: 0.5 },
    buttonText: {
      color: theme.accentText,
      fontWeight: "700",
      fontSize: 16,
      letterSpacing: 0.3,
      fontFamily: Fonts?.rounded,
    },
    switch: { paddingVertical: 8, alignItems: "center" },
    switchText: {
      color: theme.accent,
      fontWeight: "600",
      fontSize: 14,
    },
  });
}

/**
 * The About tab's account card: who is signed in, edit birth details, log
 * out, and permanent account deletion (password re-entered to confirm).
 */

import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import type { Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { describeError } from "@/lib/errors";

export function AccountSection() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      // On success the auth state flips to anonymous and the root layout
      // redirects to the login screen.
      await deleteAccount(password);
    } catch (err) {
      setDeleting(false);
      if (err instanceof ApiError && err.code === "INVALID_PASSWORD") {
        setError(t.account.wrongPassword);
      } else if (err instanceof ApiError && err.status === 401) {
        // The session expired; back to the login screen.
        await logout();
      } else {
        setError(describeError(err, t));
      }
    }
  };

  return (
    <View style={styles.card}>
      <ThemedText style={styles.title}>{t.account.title}</ThemedText>
      <ThemedText style={styles.muted}>
        {t.auth.loggedInAs} {user.email}
      </ThemedText>

      <Pressable
        onPress={() => router.push("/profile" as never)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}>
        <ThemedText style={styles.rowButtonText}>{t.account.editBirth}</ThemedText>
        <ThemedText style={styles.chevron}>›</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => void logout()}
        accessibilityRole="button"
        style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
        <ThemedText style={styles.outlineButtonText}>{t.auth.logout}</ThemedText>
      </Pressable>

      {!confirming ? (
        <Pressable
          onPress={() => setConfirming(true)}
          accessibilityRole="button"
          style={styles.deleteLink}>
          <ThemedText style={styles.deleteLinkText}>{t.account.deleteTitle}</ThemedText>
        </Pressable>
      ) : (
        <View style={styles.dangerZone}>
          <ThemedText style={styles.dangerText}>{t.account.deleteWarning}</ThemedText>
          <ThemedText style={styles.label}>{t.account.deletePasswordLabel}</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            placeholder={t.auth.login.passwordPlaceholder}
            placeholderTextColor={theme.placeholder}
            style={styles.input}
          />
          {error ? <ThemedText style={styles.dangerText}>{error}</ThemedText> : null}
          <View style={styles.dangerActions}>
            <Pressable
              onPress={() => {
                setConfirming(false);
                setPassword("");
                setError(null);
              }}
              accessibilityRole="button"
              style={styles.cancel}>
              <ThemedText style={styles.cancelText}>{t.common.cancel}</ThemedText>
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              disabled={!password || deleting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.pressed,
                (!password || deleting) && styles.disabled,
              ]}>
              {deleting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.dangerButtonText}>{t.account.deleteConfirm}</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    title: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted,
    },
    muted: { fontSize: 13, lineHeight: 18, color: theme.muted },
    label: { fontSize: 12, fontWeight: "600", color: theme.muted },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
    rowButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.surfaceMuted,
    },
    rowButtonText: { fontSize: 15, fontWeight: "600", color: theme.text },
    chevron: { fontSize: 20, color: theme.muted },
    outlineButton: {
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    outlineButtonText: { fontSize: 15, fontWeight: "600", color: theme.text },
    deleteLink: { alignSelf: "center", paddingVertical: 6 },
    deleteLinkText: { fontSize: 13, fontWeight: "600", color: theme.danger },
    dangerZone: {
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.danger + "55",
      backgroundColor: theme.danger + "11",
    },
    dangerText: { fontSize: 13, lineHeight: 18, color: theme.danger },
    input: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.inputBackground,
      color: theme.text,
      fontSize: 15,
    },
    dangerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
    cancel: { paddingVertical: 10, paddingHorizontal: 12 },
    cancelText: { fontSize: 14, fontWeight: "600", color: theme.muted },
    dangerButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: theme.danger,
      alignItems: "center",
    },
    dangerButtonText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  });
}

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  BirthFields,
  isCompleteBirth,
  type BirthValues,
} from "@/features/account/birth-fields";

/** Edit birth details. Saving recomputes the user's chart on the server. */
export default function ProfileScreen() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { user, updateBirth } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [birth, setBirth] = useState<BirthValues>({
    date: user?.birthLocalDate ?? null,
    time: user?.birthLocalTime ?? null,
    district: user?.district ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const save = async () => {
    if (!birth.district) {
      setMessage({ kind: "error", text: t.auth.signup.errorPickDistrict });
      return;
    }
    if (!isCompleteBirth(birth)) {
      setMessage({ kind: "error", text: t.auth.signup.errorPickBirth });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateBirth({
        birthLocalDate: birth.date,
        birthLocalTime: birth.time,
        latitude: birth.district.latitude,
        longitude: birth.district.longitude,
        districtId: birth.district.id,
      });
      setMessage({ kind: "ok", text: t.profile.saved });
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 400 && !err.code
          ? t.auth.signup.errorInvalid
          : describeError(err, t);
      setMessage({ kind: "error", text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backRow} accessibilityRole="button">
            <ThemedText style={styles.backText}>‹ {t.nav.about}</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <ThemedText style={styles.title}>{t.profile.title}</ThemedText>
            <ThemedText style={styles.tagline}>{t.profile.subtitle}</ThemedText>
          </View>

          <View style={styles.card}>
            <BirthFields value={birth} onChange={setBirth} />

            {message ? (
              <View style={message.kind === "ok" ? styles.okBanner : styles.errorBanner}>
                <ThemedText style={message.kind === "ok" ? styles.okText : styles.errorText}>
                  {message.text}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                saving && styles.buttonDisabled,
              ]}>
              {saving ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <ThemedText style={styles.buttonText}>{t.common.save}</ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },
    scroll: { padding: 20, gap: 16, paddingBottom: 64 },
    backRow: { paddingVertical: 8 },
    backText: { fontSize: 15, fontWeight: "600", color: theme.accent },
    header: { gap: 4 },
    title: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: 32,
      color: theme.text,
      fontFamily: Fonts?.rounded,
    },
    tagline: { fontSize: 14, lineHeight: 20, color: theme.muted },
    card: {
      gap: 14,
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
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
    okBanner: {
      backgroundColor: theme.accent + "1A",
      borderWidth: 1,
      borderColor: theme.accentBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    okText: { color: theme.accent, fontSize: 13 },
    button: {
      backgroundColor: theme.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
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
  });
}

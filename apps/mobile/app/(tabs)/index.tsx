import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MatchForm, type MatchFormValues } from "@/features/match/match-form";
import { MatchResults } from "@/features/match/match-results";
import { ApiError, postMatch, type MatchResult } from "@/lib/api";

export default function HomeScreen() {
  const theme = useTheme();
  const t = useT();
  const { token, user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: MatchFormValues) => {
      if (!token) {
        setError(t.form.errors.apiUnknown);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const next = await postMatch(values, token);
        setResult(next);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`${t.form.errors.apiPrefix} (${err.status}).`);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t.form.errors.apiUnknown);
        }
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [t, token],
  );

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
            <ThemedText style={styles.title}>{t.home.title}</ThemedText>
            <ThemedText style={styles.tagline}>{t.home.tagline}</ThemedText>
            {user ? (
              <ThemedText style={styles.signedIn}>
                {t.auth.loggedInAs} {user.email}
              </ThemedText>
            ) : null}
          </View>

          <MatchForm onSubmit={handleSubmit} loading={loading} error={error} />

          {result ? <MatchResults result={result} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      padding: 20,
      gap: 20,
      paddingBottom: 64,
    },
    header: {
      paddingTop: 12,
      paddingBottom: 4,
      gap: 4,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.accent,
    },
    title: {
      fontSize: 38,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: 42,
      color: theme.text,
      fontFamily: Fonts?.rounded,
    },
    tagline: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: theme.muted,
    },
    signedIn: {
      marginTop: 8,
      fontSize: 12,
      color: theme.muted,
    },
  });
}

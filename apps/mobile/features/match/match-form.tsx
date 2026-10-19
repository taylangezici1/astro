import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import type { MatchRequest, SynastryRule } from "@/lib/api";
import { AdvancedControls } from "./advanced-controls";

export interface MatchFormValues extends MatchRequest {}

interface Props {
  onSubmit: (values: MatchFormValues) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Server-side defaults, mirrored on the client so collapsed-and-untouched
 * matches the unauthenticated baseline.
 */
const DEFAULT_ORB = 5;
const DEFAULT_RULES: SynastryRule[] = [
  { self: "venus", aspect: "trine", other: "mars" },
  { self: "sun", aspect: "trine", other: "moon" },
];

/**
 * Match form, post-auth edition. Birth data is captured at signup, so this
 * screen only carries the matching tunables and the submit button.
 */
export function MatchForm({ onSubmit, loading, error }: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [orb, setOrb] = useState<number>(DEFAULT_ORB);
  const [rules, setRules] = useState<SynastryRule[]>(DEFAULT_RULES);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (rules.length === 0) {
      setValidationError(t.form.errors.addRule);
      return;
    }
    setValidationError(null);
    onSubmit({ orb, rules });
  };

  const displayedError = validationError ?? error ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          {t.form.title}
        </ThemedText>
        <ThemedText style={styles.headerHint}>{t.form.hint}</ThemedText>
      </View>

      <AdvancedControls
        open={advancedOpen}
        onToggle={() => setAdvancedOpen((v) => !v)}
        orb={orb}
        onOrbChange={setOrb}
        rules={rules}
        onRulesChange={setRules}
      />

      {displayedError ? (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>{displayedError}</ThemedText>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!loading }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={theme.accentText} />
        ) : (
          <ThemedText style={styles.buttonText}>{t.form.button}</ThemedText>
        )}
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: 16,
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: { gap: 6 },
    headerTitle: { fontSize: 20, fontWeight: "700" },
    headerHint: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.muted,
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
  });
}

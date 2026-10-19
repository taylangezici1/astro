import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import {
  DEFAULT_ORB,
  DEFAULT_SYNASTRY_RULES,
  type MatchRequest,
  type SynastryRule,
} from "@/lib/api";
import { loadJSON, saveJSON } from "@/lib/persist";
import { AdvancedControls } from "./advanced-controls";
import { ASPECT_GLYPHS, PLANET_GLYPHS } from "./glyphs";

export type MatchFormValues = MatchRequest;

interface Props {
  onSubmit: (values: MatchFormValues) => void;
  loading?: boolean;
  error?: string | null;
}

interface Settings {
  orb: number;
  rules: SynastryRule[];
}

const SETTINGS_KEY = "synastry.matchSettings.v1";

const DEFAULTS: Settings = { orb: DEFAULT_ORB, rules: [...DEFAULT_SYNASTRY_RULES] };

/**
 * Match form. Birth data is captured at signup, so this screen only carries
 * the matching tunables (remembered between launches) and the submit button.
 */
export function MatchForm({ onSubmit, loading, error }: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJSON(SETTINGS_KEY, isSettings).then((saved) => {
      if (saved && !cancelled) setSettings(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (next: Settings) => {
    setSettings(next);
    void saveJSON(SETTINGS_KEY, next);
  };

  const handleSubmit = () => {
    if (settings.rules.length === 0) {
      setValidationError(t.form.errors.addRule);
      return;
    }
    setValidationError(null);
    onSubmit({ orb: settings.orb, rules: settings.rules });
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
        orb={settings.orb}
        onOrbChange={(orb) => update({ ...settings, orb })}
        rules={settings.rules}
        onRulesChange={(rules) => update({ ...settings, rules })}
        onReset={() => update(DEFAULTS)}
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

function isSettings(value: unknown): value is Settings {
  const v = value as Settings | null;
  return (
    typeof v?.orb === "number" &&
    v.orb > 0 &&
    v.orb <= 10 &&
    Array.isArray(v.rules) &&
    v.rules.length > 0 &&
    v.rules.every(
      (r) => r?.self in PLANET_GLYPHS && r?.other in PLANET_GLYPHS && r?.aspect in ASPECT_GLYPHS,
    )
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

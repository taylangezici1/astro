import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  consumeDetailPayload,
  type DetailPayload,
} from "@/lib/match-detail-store";
import {
  formatDegreeAsSign,
  formatMatchTimestamp,
  planetLabel,
  PLANET_ORDER,
} from "@/features/match/format";
import { formatHouseRule } from "@/features/match/format-house-rule";
import { NatalChartWheel } from "@/features/match/natal-chart-wheel";
import {
  PLANET_GLYPHS,
  PLANET_COLORS,
  ZODIAC_GLYPHS,
  signIndex,
  ZODIAC_COLORS,
} from "@/features/match/glyphs";
import type { PlanetKey } from "@/lib/api";

export default function ResultDetailScreen() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [payload, setPayload] = useState<DetailPayload | null>(null);

  useEffect(() => {
    setPayload(consumeDetailPayload());
  }, []);

  if (!payload) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText style={{ color: theme.muted }}>
          {t.results.empty.title}
        </ThemedText>
      </View>
    );
  }

  const isPhase3 = payload.kind === "phase3";
  const timestamp = isPhase3 ? payload.hit.timestamp : payload.match.timestamp;
  const matchNatal = isPhase3 ? payload.hit.natal : payload.match;
  const score = isPhase3 ? payload.hit.score : payload.match.score;
  const district = isPhase3 ? payload.hit.district : null;
  const satisfiedRules = isPhase3 ? payload.hit.satisfiedRules : [];
  const userNatal = payload.result.natal;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <ThemedText style={[styles.backText, { color: theme.accent }]}>
          {"< "}{t.detail.backLabel}
        </ThemedText>
      </Pressable>

      {/* Hero */}
      <LinearGradient
        colors={[theme.gradientFrom, theme.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <ThemedText style={styles.heroLabel}>{t.detail.heroLabel}</ThemedText>
        <ThemedText style={styles.heroDate}>
          {formatMatchTimestamp(timestamp, t)}
        </ThemedText>
        {district ? (
          <ThemedText style={styles.heroPlace}>
            {district.name}, {district.province}
          </ThemedText>
        ) : null}
      </LinearGradient>

      {/* Phase 2 note */}
      {!isPhase3 ? (
        <View style={[styles.noteCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <ThemedText style={[styles.noteText, { color: theme.muted }]}>
            {t.detail.phase2Note}
          </ThemedText>
        </View>
      ) : null}

      {/* Score */}
      <Section title={t.detail.score.title} theme={theme}>
        <Row
          theme={theme}
          label={t.detail.score.title}
          value={t.detail.score.value(score)}
          accent
        />
      </Section>

      {/* Satisfied rules */}
      {satisfiedRules.length > 0 ? (
        <Section
          title={t.detail.rulesMatched.title}
          subtitle={t.detail.rulesMatched.subtitle}
          theme={theme}
        >
          {satisfiedRules.map((rule, i) => (
            <Row
              theme={theme}
              key={i}
              label={formatHouseRule(rule, t)}
              value={"\u2713"}
              accent
            />
          ))}
        </Section>
      ) : null}

      {/* Match natal chart with wheel */}
      <Section
        title={t.detail.matchChart.title}
        subtitle={t.detail.matchChart.subtitle}
        theme={theme}
      >
        <NatalChartWheel
          chart={matchNatal}
          compare={userNatal}
          theme={theme}
        />
        {PLANET_ORDER.map((planet) => (
          <PlanetRow
            key={planet}
            planet={planet}
            longitude={matchNatal[planet]}
            theme={theme}
            t={t}
          />
        ))}
      </Section>

      {/* User natal chart for comparison */}
      {user ? (
        <Section
          title={t.detail.yourChart.title}
          subtitle={t.detail.yourChart.subtitle}
          theme={theme}
        >
          <NatalChartWheel chart={userNatal} theme={theme} />
          {PLANET_ORDER.map((planet) => (
            <PlanetRow
              key={planet}
              planet={planet}
              longitude={userNatal[planet]}
              theme={theme}
              t={t}
            />
          ))}
        </Section>
      ) : null}

      {/* Location */}
      {district ? (
        <Section title={t.detail.location.title} theme={theme}>
          <Row
            theme={theme}
            label={t.detail.location.district}
            value={`${district.name}, ${district.province}`}
          />
          <Row
            theme={theme}
            label={t.detail.location.coordinates}
            value={`${district.latitude.toFixed(4)}, ${district.longitude.toFixed(4)}`}
          />
        </Section>
      ) : null}
    </ScrollView>
  );
}

// ---------- reusable helpers ----------

import type { Translations } from "@/lib/i18n/strings";

/** A planet row with glyph, coloured dot, name, and position with zodiac glyph. */
function PlanetRow({
  planet,
  longitude,
  theme,
  t,
}: {
  planet: PlanetKey;
  longitude: number;
  theme: Theme;
  t: Translations;
}) {
  const si = signIndex(longitude);
  const color = PLANET_COLORS[planet];
  const s = rowStyles(theme);

  return (
    <View style={s.row}>
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
        <ThemedText style={{ fontSize: 18, color }}>{PLANET_GLYPHS[planet]}</ThemedText>
        <ThemedText style={s.label}>{planetLabel(planet, t)}</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <ThemedText style={[s.value, { color: ZODIAC_COLORS[si] }]}>
          {ZODIAC_GLYPHS[si]}
        </ThemedText>
        <ThemedText style={s.value}>
          {formatDegreeAsSign(longitude, t)}
        </ThemedText>
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
  theme,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  theme: Theme;
}) {
  const s = sectionStyles(theme);
  return (
    <View style={s.card}>
      <View style={s.headerBlock}>
        <ThemedText style={s.title}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={s.subtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  theme,
  accent,
}: {
  label: string;
  value: string;
  theme: Theme;
  accent?: boolean;
}) {
  const s = rowStyles(theme);
  return (
    <View style={s.row}>
      <ThemedText style={s.label}>{label}</ThemedText>
      <ThemedText style={[s.value, accent && { color: theme.accent }]}>
        {value}
      </ThemedText>
    </View>
  );
}

// ---------- styles ----------

const sectionStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    headerBlock: { gap: 4 },
    title: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted,
    },
    subtitle: { fontSize: 13, lineHeight: 18, color: theme.muted },
    body: { gap: 8 },
  });

const rowStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    label: { flex: 1, fontSize: 13, color: theme.muted, paddingRight: 8 },
    value: {
      fontSize: 14,
      fontVariant: ["tabular-nums"],
      color: theme.text,
      fontWeight: "600",
    },
  });

function createStyles(theme: Theme) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    scroll: { padding: 20, gap: 16, paddingBottom: 64 },
    backRow: { paddingVertical: 8 },
    backText: { fontSize: 15, fontWeight: "600" },
    hero: {
      padding: 22,
      borderRadius: 22,
      gap: 6,
      shadowColor: theme.gradientFrom,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    heroLabel: {
      color: "#ffffff",
      opacity: 0.85,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    heroDate: {
      color: "#ffffff",
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 30,
      fontFamily: Fonts?.rounded,
    },
    heroPlace: {
      color: "#ffffff",
      opacity: 0.95,
      fontSize: 16,
      fontWeight: "500",
    },
    noteCard: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    noteText: { fontSize: 13, lineHeight: 18 },
  });
}

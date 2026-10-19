import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { findHit } from "@/lib/match-detail-store";
import { formatLocalDateTime, PLANET_ORDER, toScore } from "@/features/match/format";
import { NatalChartWheel } from "@/features/match/natal-chart-wheel";
import { PlanetRow, Row, Section } from "@/features/match/ui";

export default function ResultDetailScreen() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { ts } = useLocalSearchParams<{ ts?: string }>();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const found = ts ? findHit(ts) : null;

  const back = (
    <Pressable onPress={() => router.back()} style={styles.backRow} accessibilityRole="button">
      <ThemedText style={styles.backText}>‹ {t.detail.backLabel}</ThemedText>
    </Pressable>
  );

  if (!found) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={["top"]}>
        <ThemedText style={styles.notFound}>{t.detail.notFound}</ThemedText>
        {back}
      </SafeAreaView>
    );
  }

  const { hit, result } = found;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {back}

        <LinearGradient
          colors={[theme.gradientFrom, theme.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <ThemedText style={styles.heroLabel}>{t.detail.heroLabel}</ThemedText>
          <ThemedText style={styles.heroDate}>{formatLocalDateTime(hit.localISO, t)}</ThemedText>
          <ThemedText style={styles.heroPlace}>
            {t.results.hero.placePrefix} {hit.district.name}, {hit.district.province}
          </ThemedText>
        </LinearGradient>

        <Section title={t.detail.fit.title} subtitle={t.detail.fit.explain} theme={theme}>
          <Row
            theme={theme}
            label={t.detail.fit.overall}
            value={`${toScore(hit.compatibility)}/100`}
            accent
          />
          <Row theme={theme} label={t.detail.fit.aspects} value={`${toScore(hit.aspectFit)}/100`} />
          <Row theme={theme} label={t.detail.fit.houses} value={`${toScore(hit.houseFit)}/100`} />
        </Section>

        <Section title={t.detail.aspects.title} subtitle={t.detail.aspects.subtitle} theme={theme}>
          {hit.aspects.map((a, i) => (
            <Row
              key={i}
              theme={theme}
              label={t.aspectRule(a.rule)}
              value={t.aspectDistance(a.distance, a.inOrb)}
              accent={a.inOrb}
            />
          ))}
        </Section>

        <Section title={t.detail.houses.title} subtitle={t.detail.houses.subtitle} theme={theme}>
          {hit.satisfiedRules.length > 0 ? (
            hit.satisfiedRules.map((rule, i) => (
              <Row key={i} theme={theme} label={t.houseRule(rule)} value="✓" accent />
            ))
          ) : (
            <ThemedText style={styles.muted}>{t.detail.houses.none}</ThemedText>
          )}
        </Section>

        <Section
          title={t.detail.matchChart.title}
          subtitle={t.detail.matchChart.subtitle}
          theme={theme}>
          <NatalChartWheel chart={hit.natal} compare={result.natal} theme={theme} />
          {PLANET_ORDER.map((planet) => (
            <PlanetRow key={planet} planet={planet} longitude={hit.natal[planet]} theme={theme} t={t} />
          ))}
        </Section>

        <Section
          title={t.detail.yourChart.title}
          subtitle={t.detail.yourChart.subtitle}
          theme={theme}>
          <NatalChartWheel chart={result.natal} theme={theme} />
          {PLANET_ORDER.map((planet) => (
            <PlanetRow
              key={planet}
              planet={planet}
              longitude={result.natal[planet]}
              theme={theme}
              t={t}
            />
          ))}
        </Section>

        <Section title={t.detail.location.title} theme={theme}>
          <Row
            theme={theme}
            label={t.detail.location.localTime}
            value={formatLocalDateTime(hit.localISO, t)}
          />
          <Row theme={theme} label={t.detail.location.timezone} value={hit.timezone} />
          <Row
            theme={theme}
            label={t.detail.location.district}
            value={`${hit.district.name}, ${hit.district.province}`}
          />
          <Row
            theme={theme}
            label={t.detail.location.coordinates}
            value={`${hit.district.latitude.toFixed(4)}, ${hit.district.longitude.toFixed(4)}`}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    center: { alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
    scroll: { padding: 20, gap: 16, paddingBottom: 64 },
    backRow: { paddingVertical: 8 },
    backText: { fontSize: 15, fontWeight: "600", color: theme.accent },
    notFound: { color: theme.muted, textAlign: "center" },
    muted: { fontSize: 13, lineHeight: 18, color: theme.muted },
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
  });
}

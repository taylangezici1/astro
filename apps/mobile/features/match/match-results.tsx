import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import type { MatchResult, RefinementHit } from "@/lib/api";
import { rememberResult } from "@/lib/match-detail-store";

import { formatDegreeAsSign, formatLocalDateTime, planetLabel, PLANET_ORDER, toScore } from "./format";
import { ASPECT_GLYPHS, PLANET_GLYPHS } from "./glyphs";
import { PlanetRow, Row, Section } from "./ui";

interface Props {
  result: MatchResult;
}

/**
 * Renders a /match result: a hero card for the best match, why it matches,
 * the runners-up (each a different person), then the user's own chart and
 * the target degrees we searched for.
 */
export function MatchResults({ result }: Props) {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { best, top, rules: houseRules, stats } = result.refinement;

  const open = useCallback(
    (hit: RefinementHit) => {
      rememberResult(result);
      router.push({ pathname: "/result-detail", params: { ts: hit.timestamp } } as never);
    },
    [result, router],
  );

  if (!best) {
    return (
      <View style={styles.empty}>
        <ThemedText type="subtitle">{t.results.empty.title}</ThemedText>
        <ThemedText style={styles.emptyHint}>{t.results.empty.hint}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => open(best)} accessibilityRole="button">
        <LinearGradient
          colors={[theme.gradientFrom, theme.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <ThemedText style={styles.heroLabel}>{t.results.hero.label}</ThemedText>
          <ThemedText style={styles.heroDate}>{formatLocalDateTime(best.localISO, t)}</ThemedText>
          <ThemedText style={styles.heroPlace}>
            {t.results.hero.placePrefix} {best.district.name}, {best.district.province}
          </ThemedText>
          <View style={styles.heroDivider} />
          <ThemedText style={styles.heroMeta}>
            {t.results.hero.summary(
              best.aspects.filter((a) => a.inOrb).length,
              best.aspects.length,
              best.satisfiedRules.length,
              houseRules.length,
            )}
          </ThemedText>
          <ThemedText style={styles.heroMeta}>
            {t.results.hero.fit(toScore(best.compatibility))} · {t.results.hero.hint}
          </ThemedText>
        </LinearGradient>
      </Pressable>

      <Section title={t.results.why.title} subtitle={t.results.why.subtitle} theme={theme}>
        {best.aspects.map((a, i) => (
          <Row
            key={`a${i}`}
            theme={theme}
            label={t.aspectRule(a.rule)}
            value={t.aspectDistance(a.distance, a.inOrb)}
            accent={a.inOrb}
          />
        ))}
        {best.satisfiedRules.map((rule, i) => (
          <Row key={`h${i}`} theme={theme} label={t.houseRule(rule)} value="✓" accent />
        ))}
      </Section>

      {top.length > 1 ? (
        <Section
          title={t.results.others.title(top.length - 1)}
          subtitle={t.results.others.subtitle}
          theme={theme}>
          {top.slice(1).map((hit) => (
            <Pressable key={hit.timestamp} onPress={() => open(hit)} accessibilityRole="button">
              <Row
                theme={theme}
                label={formatLocalDateTime(hit.localISO, t)}
                sublabel={`${hit.district.name}, ${hit.district.province}`}
                value={`${toScore(hit.compatibility)}/100`}
              />
            </Pressable>
          ))}
        </Section>
      ) : null}

      <Section
        title={t.results.sky.title}
        subtitle={t.results.sky.subtitle(result.birth.localISO, result.birth.timezone)}
        theme={theme}>
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

      <Section title={t.results.looking.title} subtitle={t.results.looking.subtitle} theme={theme}>
        {result.bands.map((band, i) => (
          <Row
            theme={theme}
            key={i}
            label={`${PLANET_GLYPHS[band.rule.self]} ${planetLabel(band.rule.self, t)} ${ASPECT_GLYPHS[band.rule.aspect]} ${planetLabel(band.rule.other, t)} ${PLANET_GLYPHS[band.rule.other]}`}
            value={band.targets
              .map((deg) => formatDegreeAsSign(deg, t))
              .join(t.results.looking.separator)}
          />
        ))}
      </Section>

      <ThemedText style={styles.footer}>
        {t.results.footer(
          result.matches.length,
          stats.pairsEvaluated.toLocaleString(t.localeTag),
          stats.elapsedMs,
        )}
      </ThemedText>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: 16,
    },
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
    heroDivider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.25)",
      marginVertical: 8,
    },
    heroMeta: {
      color: "#ffffff",
      opacity: 0.85,
      fontSize: 12,
    },
    empty: {
      padding: 22,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    emptyHint: {
      fontSize: 13,
      color: theme.muted,
    },
    footer: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.muted,
      textAlign: "center",
      paddingHorizontal: 8,
    },
  });
}

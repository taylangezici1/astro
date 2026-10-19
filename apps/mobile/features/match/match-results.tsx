import { useMemo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import type { MatchResult, PlanetKey, RefinementHit, SkyMatch } from "@/lib/api";
import type { Translations } from "@/lib/i18n/strings";
import { setDetailPayload } from "@/lib/match-detail-store";

import {
  formatDegreeAsSign,
  formatMatchTimestamp,
  planetLabel,
  PLANET_ORDER,
} from "./format";
import { formatHouseRule } from "./format-house-rule";
import {
  PLANET_GLYPHS,
  PLANET_COLORS,
  ZODIAC_GLYPHS,
  ZODIAC_COLORS,
  signIndex,
  ASPECT_GLYPHS,
} from "./glyphs";

interface Props {
  result: MatchResult;
}

/**
 * Renders the Phase 2 + Phase 3 output: a hero "soulmate" card on top, then
 * supporting sections (natal chart, golden degrees, satisfied house rules,
 * runner-up districts).
 */
export function MatchResults({ result }: Props) {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const phase3Best = result.refinement.best;
  const phase2Top = result.matches[0];

  const openPhase3 = useCallback(
    (hit: RefinementHit) => {
      setDetailPayload({ kind: "phase3", hit, result });
      router.push("/result-detail" as never);
    },
    [result, router],
  );

  const openPhase2 = useCallback(
    (match: SkyMatch) => {
      setDetailPayload({ kind: "phase2", match, result });
      router.push("/result-detail" as never);
    },
    [result, router],
  );

  return (
    <View style={styles.container}>
      {phase3Best ? (
        <Pressable onPress={() => openPhase3(phase3Best)}>
          <LinearGradient
            colors={[theme.gradientFrom, theme.gradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <ThemedText style={styles.heroLabel}>
              {t.results.hero.labelPhase3}
            </ThemedText>
            <ThemedText style={styles.heroDate}>
              {formatMatchTimestamp(phase3Best.timestamp, t)}
            </ThemedText>
            <ThemedText style={styles.heroPlace}>
              {t.results.hero.placePrefix} {phase3Best.district.name},{" "}
              {phase3Best.district.province}
            </ThemedText>
            <View style={styles.heroDivider} />
            <ThemedText style={styles.heroMeta}>
              {t.results.hero.metaPhase3(
                phase3Best.score,
                result.refinement.rules.length,
                result.refinement.stats.pairsEvaluated.toLocaleString(t.localeTag),
                result.refinement.stats.elapsedMs,
              )}
            </ThemedText>
          </LinearGradient>
        </Pressable>
      ) : phase2Top ? (
        <Pressable onPress={() => openPhase2(phase2Top)}>
          <LinearGradient
            colors={[theme.gradientFrom, theme.gradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <ThemedText style={styles.heroLabel}>
              {t.results.hero.labelPhase2}
            </ThemedText>
            <ThemedText style={styles.heroDate}>
              {formatMatchTimestamp(phase2Top.timestamp, t)}
            </ThemedText>
            <ThemedText style={styles.heroMeta}>
              {t.results.hero.metaPhase2(
                phase2Top.score,
                result.bands.length,
                result.orb,
              )}
            </ThemedText>
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={styles.empty}>
          <ThemedText type="subtitle">{t.results.empty.title}</ThemedText>
          <ThemedText style={styles.emptyHint}>{t.results.empty.hint}</ThemedText>
        </View>
      )}

      {phase3Best && phase3Best.satisfiedRules.length > 0 ? (
        <Section
          title={t.results.why.title}
          subtitle={t.results.why.subtitle}
          theme={theme}>
          {phase3Best.satisfiedRules.map((rule, i) => (
            <Row
              theme={theme}
              key={i}
              label={formatHouseRule(rule, t)}
              value="✓"
              accent
            />
          ))}
        </Section>
      ) : null}

      {result.refinement.top.length > 1 ? (
        <Section
          title={t.results.places.title(result.refinement.top.length - 1)}
          subtitle={t.results.places.subtitle}
          theme={theme}>
          {result.refinement.top.slice(1).map((hit, i) => (
            <Pressable key={i} onPress={() => openPhase3(hit)}>
              <Row
                theme={theme}
                label={`${hit.district.name}, ${hit.district.province}`}
                value={t.results.places.score(hit.score)}
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

      <Section
        title={t.results.looking.title}
        subtitle={t.results.looking.subtitle}
        theme={theme}>
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

      {result.matches.length > 1 ? (
        <Section
          title={t.results.moments.title(result.matches.length - 1)}
          subtitle={t.results.moments.subtitle}
          theme={theme}>
          {result.matches.slice(1, 6).map((m) => (
            <Pressable key={m.id} onPress={() => openPhase2(m)}>
              <Row
                theme={theme}
                label={formatMatchTimestamp(m.timestamp, t)}
                value={t.results.moments.score(m.score)}
              />
            </Pressable>
          ))}
        </Section>
      ) : null}
    </View>
  );
}

// ---------- helpers ----------

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
        <ThemedText style={{ fontSize: 16, color: ZODIAC_COLORS[si] }}>
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
  const styles = sectionStyles(theme);
  return (
    <View style={styles.card}>
      <View style={styles.headerBlock}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
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
  const styles = rowStyles(theme);
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.value, accent && { color: theme.accent }]}>
        {value}
      </ThemedText>
    </View>
  );
}

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
    headerBlock: {
      gap: 4,
    },
    title: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.muted,
    },
    body: {
      gap: 8,
    },
  });

const rowStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    label: {
      flex: 1,
      fontSize: 13,
      color: theme.muted,
      paddingRight: 8,
    },
    value: {
      fontSize: 14,
      fontVariant: ["tabular-nums"],
      color: theme.text,
      fontWeight: "600",
    },
  });

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
      opacity: 0.8,
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
  });
}

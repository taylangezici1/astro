/**
 * Small presentational building blocks shared by the results list and the
 * detail screen: a titled card, a label/value row, and a planet position row.
 */

import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Theme } from "@/constants/theme";
import type { PlanetKey } from "@/lib/api";
import type { Translations } from "@/lib/i18n/strings";

import { formatDegreeAsSign, planetLabel } from "./format";
import { PLANET_COLORS, PLANET_GLYPHS, ZODIAC_COLORS, ZODIAC_GLYPHS, signIndex } from "./glyphs";

export function Section({
  title,
  subtitle,
  children,
  theme,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  theme: Theme;
}) {
  const s = sectionStyles(theme);
  return (
    <View style={s.card}>
      <View style={s.headerBlock}>
        <ThemedText style={s.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={s.subtitle}>{subtitle}</ThemedText> : null}
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

export function Row({
  label,
  sublabel,
  value,
  theme,
  accent,
}: {
  label: string;
  sublabel?: string;
  value: string;
  theme: Theme;
  accent?: boolean;
}) {
  const s = rowStyles(theme);
  return (
    <View style={s.row}>
      <View style={s.labelBlock}>
        <ThemedText style={s.label}>{label}</ThemedText>
        {sublabel ? <ThemedText style={s.sublabel}>{sublabel}</ThemedText> : null}
      </View>
      <ThemedText style={[s.value, accent && { color: theme.accent }]}>{value}</ThemedText>
    </View>
  );
}

/** A planet glyph + name, and its position with the zodiac sign glyph. */
export function PlanetRow({
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
  const s = rowStyles(theme);
  return (
    <View style={s.row}>
      <View style={s.planet}>
        <ThemedText style={{ fontSize: 18, color: PLANET_COLORS[planet] }}>
          {PLANET_GLYPHS[planet]}
        </ThemedText>
        <ThemedText style={s.label}>{planetLabel(planet, t)}</ThemedText>
      </View>
      <View style={s.position}>
        <ThemedText style={{ fontSize: 16, color: ZODIAC_COLORS[si] }}>
          {ZODIAC_GLYPHS[si]}
        </ThemedText>
        <ThemedText style={s.value}>{formatDegreeAsSign(longitude, t)}</ThemedText>
      </View>
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
      gap: 8,
    },
    labelBlock: { flex: 1, gap: 2 },
    label: { flexShrink: 1, fontSize: 13, color: theme.muted },
    sublabel: { fontSize: 12, color: theme.muted, opacity: 0.8 },
    value: {
      fontSize: 14,
      fontVariant: ["tabular-nums"],
      color: theme.text,
      fontWeight: "600",
      textAlign: "right",
      flexShrink: 1,
    },
    planet: { flexDirection: "row", alignItems: "center", flex: 1, gap: 8 },
    position: { flexDirection: "row", alignItems: "center", gap: 6 },
  });

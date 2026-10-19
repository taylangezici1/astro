/**
 * Advanced matching controls — orb tolerance + the synastry rule set.
 *
 * Surfaced as a collapsible section under the main form. The state lives in
 * MatchForm; this component is purely presentational. Defaults mirror the
 * server (`@synastry/api/src/matching/golden-degree.ts` DEFAULT_RULES, and
 * `matching.service.ts` DEFAULT_ORB) so collapsed-and-untouched produces the
 * same query as no advanced state at all.
 */

import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import type { AspectName, PlanetKey, SynastryRule } from "@/lib/api";

interface Props {
  open: boolean;
  onToggle: () => void;
  orb: number;
  onOrbChange: (next: number) => void;
  rules: SynastryRule[];
  onRulesChange: (next: SynastryRule[]) => void;
}

const ORB_MIN = 0.5;
const ORB_MAX = 10;
const ORB_STEP = 0.5;
const MAX_RULES = 6;

export function AdvancedControls({
  open,
  onToggle,
  orb,
  onOrbChange,
  rules,
  onRulesChange,
}: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Build planet/aspect option lists from the active translations so the
  // accessibility labels (and any future text labels) follow the language.
  const PLANET_OPTIONS: { key: PlanetKey; glyph: string; label: string }[] = [
    { key: "sun", glyph: "☉", label: t.planets.sun },
    { key: "moon", glyph: "☽", label: t.planets.moon },
    { key: "mercury", glyph: "☿", label: t.planets.mercury },
    { key: "venus", glyph: "♀", label: t.planets.venus },
    { key: "mars", glyph: "♂", label: t.planets.mars },
    { key: "jupiter", glyph: "♃", label: t.planets.jupiter },
    { key: "saturn", glyph: "♄", label: t.planets.saturn },
  ];

  const ASPECT_OPTIONS: { key: AspectName; label: string }[] = [
    { key: "conjunction", label: t.aspects.conjunction },
    { key: "sextile", label: t.aspects.sextile },
    { key: "square", label: t.aspects.square },
    { key: "trine", label: t.aspects.trine },
    { key: "opposition", label: t.aspects.opposition },
  ];

  const updateRule = (index: number, patch: Partial<SynastryRule>) => {
    onRulesChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const addRule = () => {
    if (rules.length >= MAX_RULES) return;
    onRulesChange([
      ...rules,
      { self: "venus", aspect: "trine", other: "mars" },
    ]);
  };

  const decOrb = () => onOrbChange(Math.max(ORB_MIN, +(orb - ORB_STEP).toFixed(1)));
  const incOrb = () => onOrbChange(Math.min(ORB_MAX, +(orb + ORB_STEP).toFixed(1)));

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        style={styles.header}>
        <ThemedText style={styles.headerLabel}>{t.advanced.header}</ThemedText>
        <ThemedText style={styles.headerHint}>
          {open ? "" : t.advanced.summary(orb, rules.length)}
        </ThemedText>
        <ThemedText style={styles.headerCaret}>{open ? "▾" : "▸"}</ThemedText>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <ThemedText style={styles.intro}>{t.advanced.intro}</ThemedText>

          {/* ---------- orb ---------- */}
          <View style={styles.field}>
            <ThemedText style={styles.fieldLabel}>{t.advanced.orb.title}</ThemedText>
            <ThemedText style={styles.fieldHint}>
              {t.advanced.orb.hintLine1}
            </ThemedText>
            <View style={styles.stepper}>
              <Pressable
                onPress={decOrb}
                disabled={orb <= ORB_MIN}
                style={({ pressed }) => [
                  styles.stepperButton,
                  pressed && styles.stepperButtonPressed,
                  orb <= ORB_MIN && styles.stepperButtonDisabled,
                ]}>
                <ThemedText style={styles.stepperButtonText}>−</ThemedText>
              </Pressable>
              <View style={styles.stepperValue}>
                <ThemedText style={styles.stepperValueText}>±{orb}°</ThemedText>
              </View>
              <Pressable
                onPress={incOrb}
                disabled={orb >= ORB_MAX}
                style={({ pressed }) => [
                  styles.stepperButton,
                  pressed && styles.stepperButtonPressed,
                  orb >= ORB_MAX && styles.stepperButtonDisabled,
                ]}>
                <ThemedText style={styles.stepperButtonText}>+</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={styles.fieldHint}>
              {t.advanced.orb.hintLine2}
            </ThemedText>
          </View>

          {/* ---------- rules ---------- */}
          <View style={styles.field}>
            <ThemedText style={styles.fieldLabel}>{t.advanced.rules.title}</ThemedText>
            <ThemedText style={styles.fieldHint}>
              <ThemedText style={{ fontWeight: "700" }}>
                {t.advanced.rules.hint.their}
              </ThemedText>
              {" "}
              <ThemedText>{t.advanced.rules.hint.tail}</ThemedText>
            </ThemedText>

            {rules.map((rule, i) => (
              <View key={i} style={styles.rule}>
                <View style={styles.ruleHeader}>
                  <ThemedText style={styles.ruleTitle}>
                    {t.advanced.rules.ruleTitle(i + 1)}
                  </ThemedText>
                  {rules.length > 1 ? (
                    <Pressable
                      onPress={() => removeRule(i)}
                      hitSlop={8}
                      style={styles.removeButton}>
                      <ThemedText style={styles.removeButtonText}>
                        {t.common.remove}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>

                <ChipRow
                  theme={theme}
                  label={t.advanced.chips.their}
                  options={PLANET_OPTIONS.map((p) => ({
                    key: p.key,
                    label: p.glyph,
                    aria: p.label,
                  }))}
                  selected={rule.other}
                  onSelect={(k) => updateRule(i, { other: k as PlanetKey })}
                />
                <ChipRow
                  theme={theme}
                  label={t.advanced.chips.at}
                  options={ASPECT_OPTIONS.map((a) => ({ key: a.key, label: a.label }))}
                  selected={rule.aspect}
                  onSelect={(k) => updateRule(i, { aspect: k as AspectName })}
                />
                <ChipRow
                  theme={theme}
                  label={t.advanced.chips.toYour}
                  options={PLANET_OPTIONS.map((p) => ({
                    key: p.key,
                    label: p.glyph,
                    aria: p.label,
                  }))}
                  selected={rule.self}
                  onSelect={(k) => updateRule(i, { self: k as PlanetKey })}
                />
              </View>
            ))}

            {rules.length < MAX_RULES ? (
              <Pressable
                onPress={addRule}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed,
                ]}>
                <ThemedText style={styles.addButtonText}>
                  {t.advanced.rules.add}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ---------- chip row ----------

interface ChipOption {
  key: string;
  label: string;
  /** Optional spoken label when `label` is a glyph. */
  aria?: string;
}

function ChipRow({
  theme,
  label,
  options,
  selected,
  onSelect,
}: {
  theme: Theme;
  label: string;
  options: ChipOption[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const styles = chipStyles(theme);
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {options.map((opt) => {
          const active = opt.key === selected;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={opt.aria ?? opt.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && !active && styles.chipPressed,
              ]}>
              <ThemedText
                style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const chipStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rowLabel: {
      width: 64,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
      color: theme.muted,
    },
    chips: {
      gap: 6,
      paddingRight: 4,
    },
    chip: {
      minWidth: 36,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    chipPressed: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentBorder,
    },
    chipText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "600",
    },
    chipTextActive: {
      color: theme.accentText,
    },
  });

// ---------- main styles ----------

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: theme.muted,
    },
    headerHint: {
      flex: 1,
      fontSize: 12,
      color: theme.muted,
    },
    headerCaret: {
      fontSize: 14,
      color: theme.muted,
    },
    body: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 16,
    },
    intro: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.muted,
    },
    field: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.muted,
    },
    fieldHint: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.muted,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperButtonPressed: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentBorder,
    },
    stepperButtonDisabled: {
      opacity: 0.4,
    },
    stepperButtonText: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    stepperValue: {
      paddingHorizontal: 16,
      minWidth: 80,
      alignItems: "center",
    },
    stepperValueText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      fontVariant: ["tabular-nums"],
    },
    rule: {
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 4,
    },
    ruleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ruleTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.text,
    },
    removeButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    removeButtonText: {
      fontSize: 12,
      color: theme.danger,
      fontWeight: "600",
    },
    addButton: {
      marginTop: 4,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      borderStyle: "dashed",
      alignItems: "center",
      backgroundColor: theme.accentSoft,
    },
    addButtonPressed: {
      opacity: 0.7,
    },
    addButtonText: {
      color: theme.accent,
      fontWeight: "700",
      fontSize: 14,
    },
  });
}

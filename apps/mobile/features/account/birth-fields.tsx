/**
 * Birth date, local birth time and birth district — the inputs the whole
 * matching engine depends on. Used by signup and by "Edit birth details".
 *
 * Date and time start empty rather than pre-filled, so nobody can sign up
 * with a placeholder birthday by accident. Native uses the platform pickers;
 * web uses text fields (YYYY-MM-DD / HH:MM).
 */

import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import type { Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import type { District } from "@/lib/api";
import { DistrictPicker } from "@/features/match/district-picker";

export interface BirthValues {
  /** YYYY-MM-DD, or null until picked. */
  date: string | null;
  /** HH:MM (24h, local), or null until picked. */
  time: string | null;
  district: District | null;
}

export const EMPTY_BIRTH: BirthValues = { date: null, time: null, district: null };

const IS_WEB = Platform.OS === "web";
/** Where the native pickers open before anything is chosen. */
const PICKER_START = new Date(1995, 0, 1, 12, 0);

export function isCompleteBirth(
  v: BirthValues,
): v is { date: string; time: string; district: District } {
  return (
    !!v.date &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    !!v.time &&
    /^\d{2}:\d{2}$/.test(v.time) &&
    !!v.district
  );
}

export function BirthFields({
  value,
  onChange,
}: {
  value: BirthValues;
  onChange: (next: BirthValues) => void;
}) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !selected) return;
    if (pickerMode === "date") {
      onChange({
        ...value,
        date: `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`,
      });
    } else if (pickerMode === "time") {
      onChange({ ...value, time: `${pad(selected.getHours())}:${pad(selected.getMinutes())}` });
    }
  };

  return (
    <View style={styles.wrap}>
      {IS_WEB ? (
        <>
          <Field label={t.form.fields.birthDateWeb} styles={styles}>
            <TextInput
              value={value.date ?? ""}
              onChangeText={(date) => onChange({ ...value, date: date || null })}
              placeholder={t.form.placeholders.birthDate}
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </Field>
          <Field label={t.form.fields.birthTimeWeb} styles={styles}>
            <TextInput
              value={value.time ?? ""}
              onChangeText={(time) => onChange({ ...value, time: time || null })}
              placeholder={t.form.placeholders.birthTime}
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={t.form.fields.birthDateNative} styles={styles}>
            <PickerTrigger
              text={value.date ? formatHumanDate(value.date, t.localeTag) : t.form.placeholders.pickDate}
              placeholder={!value.date}
              onPress={() => setPickerMode("date")}
              styles={styles}
            />
          </Field>
          <Field label={t.form.fields.birthTimeNative} styles={styles}>
            <PickerTrigger
              text={value.time ?? t.form.placeholders.pickTime}
              placeholder={!value.time}
              onPress={() => setPickerMode("time")}
              styles={styles}
            />
          </Field>

          {pickerMode ? (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={toPickerDate(value)}
                mode={pickerMode}
                is24Hour
                maximumDate={pickerMode === "date" ? new Date() : undefined}
                minimumDate={pickerMode === "date" ? new Date(1900, 0, 1) : undefined}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onPickerChange}
              />
              {Platform.OS === "ios" ? (
                <Pressable onPress={() => setPickerMode(null)} style={styles.pickerDone}>
                  <ThemedText style={styles.pickerDoneText}>{t.common.done}</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <Field label={t.form.fields.district} styles={styles}>
        <DistrictPicker value={value.district} onChange={(district) => onChange({ ...value, district })} />
      </Field>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function Field({ label, styles, children }: { label: string; styles: Styles; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </View>
  );
}

function PickerTrigger({
  text,
  placeholder,
  onPress,
  styles,
}: {
  text: string;
  placeholder: boolean;
  onPress: () => void;
  styles: Styles;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.input, styles.inputPressable, pressed && styles.inputPressed]}>
      <ThemedText style={[styles.inputText, placeholder && styles.inputPlaceholder]}>{text}</ThemedText>
    </Pressable>
  );
}

// ---------- helpers ----------

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatHumanDate(ymd: string, localeTag: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** The pickers work in device-local Date objects; only the fields matter. */
function toPickerDate(v: BirthValues): Date {
  const dm = v.date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.date) : null;
  const tm = v.time ? /^(\d{2}):(\d{2})$/.exec(v.time) : null;
  return new Date(
    dm ? Number(dm[1]) : PICKER_START.getFullYear(),
    dm ? Number(dm[2]) - 1 : PICKER_START.getMonth(),
    dm ? Number(dm[3]) : PICKER_START.getDate(),
    tm ? Number(tm[1]) : PICKER_START.getHours(),
    tm ? Number(tm[2]) : PICKER_START.getMinutes(),
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { gap: 14 },
    field: { gap: 6 },
    label: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.muted,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.inputBackground,
      color: theme.text,
      fontSize: 15,
    },
    inputPressable: { justifyContent: "center" },
    inputPressed: {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.accentBorder,
    },
    inputText: { fontSize: 15, color: theme.text },
    inputPlaceholder: { color: theme.placeholder },
    pickerWrap: {
      alignItems: "center",
      backgroundColor: theme.surfaceMuted,
      borderRadius: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerDone: { paddingVertical: 8, paddingHorizontal: 24, marginTop: 4 },
    pickerDoneText: {
      color: theme.accent,
      fontWeight: "700",
      fontSize: 16,
    },
  });
}

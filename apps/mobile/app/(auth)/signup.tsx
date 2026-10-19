import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ApiError, type District } from "@/lib/api";
import { DistrictPicker } from "@/features/match/district-picker";

const IS_WEB = Platform.OS === "web";
const DEFAULT_BIRTH_DATE = "1994-10-12";
const DEFAULT_BIRTH_TIME = "17:15";

export default function SignupScreen() {
  const theme = useTheme();
  const t = useT();
  const router = useRouter();
  const { signup } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH_DATE);
  const [birthTime, setBirthTime] = useState(DEFAULT_BIRTH_TIME);
  const [district, setDistrict] = useState<District | null>(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickerValue = useMemo(
    () => stringsToLocalDate(birthDate, birthTime),
    [birthDate, birthTime],
  );

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !selected) return;
    if (pickerMode === "date") {
      setBirthDate(
        `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`,
      );
    } else if (pickerMode === "time") {
      setBirthTime(`${pad(selected.getHours())}:${pad(selected.getMinutes())}`);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t.auth.signup.errorMissingFields);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.signup.errorPasswordTooShort);
      return;
    }
    if (!district) {
      setError(t.auth.signup.errorPickDistrict);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signup({
        email: email.trim(),
        password,
        birthLocalDate: birthDate,
        birthLocalTime: birthTime,
        latitude: district.latitude,
        longitude: district.longitude,
        districtId: district.id,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t.auth.signup.errorEmailTaken);
      } else {
        setError(t.auth.signup.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

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
            <ThemedText style={styles.title}>{t.auth.signup.title}</ThemedText>
            <ThemedText style={styles.tagline}>{t.auth.signup.tagline}</ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>
              {t.auth.signup.sectionAccount}
            </ThemedText>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t.auth.login.emailLabel}
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.login.emailPlaceholder}
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t.auth.login.passwordLabel}
              </ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.login.passwordPlaceholder}
                placeholderTextColor={theme.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.divider} />

            <ThemedText style={styles.sectionTitle}>
              {t.auth.signup.sectionBirth}
            </ThemedText>
            <ThemedText style={styles.hint}>
              {t.auth.signup.birthHint}
            </ThemedText>

            {IS_WEB ? (
              <>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>
                    {t.form.fields.birthDateWeb}
                  </ThemedText>
                  <TextInput
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder={t.form.placeholders.birthDate}
                    placeholderTextColor={theme.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>
                    {t.form.fields.birthTimeWeb}
                  </ThemedText>
                  <TextInput
                    value={birthTime}
                    onChangeText={setBirthTime}
                    placeholder={t.form.placeholders.birthTime}
                    placeholderTextColor={theme.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>
                    {t.form.fields.birthDateNative}
                  </ThemedText>
                  <Pressable
                    onPress={() => setPickerMode("date")}
                    style={({ pressed }) => [
                      styles.input,
                      styles.inputPressable,
                      pressed && styles.inputPressed,
                    ]}>
                    <ThemedText style={styles.inputText}>
                      {formatHumanDate(birthDate, t.localeTag)}
                    </ThemedText>
                  </Pressable>
                </View>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>
                    {t.form.fields.birthTimeNative}
                  </ThemedText>
                  <Pressable
                    onPress={() => setPickerMode("time")}
                    style={({ pressed }) => [
                      styles.input,
                      styles.inputPressable,
                      pressed && styles.inputPressed,
                    ]}>
                    <ThemedText style={styles.inputText}>{birthTime}</ThemedText>
                  </Pressable>
                </View>

                {pickerMode ? (
                  <View style={styles.pickerWrap}>
                    <DateTimePicker
                      value={pickerValue}
                      mode={pickerMode}
                      is24Hour
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onPickerChange}
                    />
                    {Platform.OS === "ios" ? (
                      <Pressable
                        onPress={() => setPickerMode(null)}
                        style={styles.pickerDone}>
                        <ThemedText style={styles.pickerDoneText}>
                          {t.common.done}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </>
            )}

            <View style={styles.field}>
              <ThemedText style={styles.label}>{t.form.fields.district}</ThemedText>
              <DistrictPicker value={district} onChange={setDistrict} />
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}>
              {loading ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {t.auth.signup.submit}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace("/(auth)/login" as never)}
              style={styles.switch}>
              <ThemedText style={styles.switchText}>
                {t.auth.signup.switchToLogin}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

function stringsToLocalDate(ymd: string, hm: string): Date {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  const tm = /^(\d{2}):(\d{2})$/.exec(hm);
  if (!dm || !tm) return new Date();
  return new Date(
    Number(dm[1]),
    Number(dm[2]) - 1,
    Number(dm[3]),
    Number(tm[1]),
    Number(tm[2]),
    0,
    0,
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    scroll: { padding: 20, gap: 20, paddingBottom: 64 },
    header: { paddingTop: 24, gap: 4 },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.accent,
    },
    title: {
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: 34,
      color: theme.text,
      fontFamily: Fonts?.rounded,
    },
    tagline: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: theme.muted,
    },
    card: {
      gap: 14,
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: theme.muted,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.muted,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 6,
    },
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
    switch: { paddingVertical: 8, alignItems: "center" },
    switchText: { color: theme.accent, fontWeight: "600", fontSize: 14 },
  });
}

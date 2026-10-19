import { useMemo } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Fonts, type Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLocale, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function AboutScreen() {
  const theme = useTheme();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { user, logout } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.eyebrow}>{t.about.eyebrow}</ThemedText>
          <ThemedText style={styles.title}>{t.about.title}</ThemedText>
          <ThemedText style={styles.tagline}>{t.about.tagline}</ThemedText>
        </View>

        <Section title={t.about.language.title} theme={theme}>
          <ThemedText style={styles.subtitle}>{t.about.language.subtitle}</ThemedText>
          <View style={styles.langRow}>
            <LangButton
              theme={theme}
              label={t.about.language.tr}
              active={locale === "tr"}
              onPress={() => setLocale("tr")}
            />
            <LangButton
              theme={theme}
              label={t.about.language.en}
              active={locale === "en"}
              onPress={() => setLocale("en")}
            />
          </View>
        </Section>

        {user ? (
          <Section title={t.about.eyebrow} theme={theme}>
            <ThemedText style={styles.subtitle}>
              {t.auth.loggedInAs} {user.email}
            </ThemedText>
            <Pressable
              onPress={() => {
                void logout();
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && { opacity: 0.85 },
              ]}>
              <ThemedText style={styles.logoutText}>{t.auth.logout}</ThemedText>
            </Pressable>
          </Section>
        ) : null}

        <Section title={t.about.pipeline.title} theme={theme}>
          <Step
            theme={theme}
            n={1}
            title={t.about.pipeline.step1.title}
            body={t.about.pipeline.step1.body}
          />
          <Step
            theme={theme}
            n={2}
            title={t.about.pipeline.step2.title}
            body={t.about.pipeline.step2.body}
          />
          <Step
            theme={theme}
            n={3}
            title={t.about.pipeline.step3.title}
            body={t.about.pipeline.step3.body}
          />
        </Section>

        <Section title={t.about.howToRead.title} theme={theme}>
          {t.about.howToRead.bullets.map((line, i) => (
            <Bullet key={i} theme={theme}>
              {line}
            </Bullet>
          ))}
        </Section>

        <Section title={t.about.sources.title} theme={theme}>
          <LinkRow
            theme={theme}
            label={t.about.sources.sweph}
            href="https://github.com/timotejroiko/sweph"
          />
          <LinkRow
            theme={theme}
            label={t.about.sources.districts}
            href="https://github.com/serkanozbeykurucu/CoordinateLookup"
          />
          <LinkRow
            theme={theme}
            label={t.about.sources.tzlookup}
            href="https://github.com/darkskyapp/tz-lookup"
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- language toggle ----------

function LangButton({
  theme,
  label,
  active,
  onPress,
}: {
  theme: Theme;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: active ? theme.accent : theme.border,
          backgroundColor: active ? theme.accent : theme.surface,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText
        style={{
          color: active ? theme.accentText : theme.text,
          fontWeight: "700",
          fontSize: 15,
        }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

// ---------- helpers ----------

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  const styles = sectionStyles(theme);
  return (
    <View style={styles.card}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

function Step({
  theme,
  n,
  title,
  body,
}: {
  theme: Theme;
  n: number;
  title: string;
  body: string;
}) {
  const styles = stepStyles(theme);
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <ThemedText style={styles.badgeText}>{n}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.body}>{body}</ThemedText>
      </View>
    </View>
  );
}

function Bullet({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <ThemedText style={{ color: theme.accent, fontSize: 14 }}>•</ThemedText>
      <ThemedText style={{ flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 }}>
        {children}
      </ThemedText>
    </View>
  );
}

function LinkRow({
  theme,
  label,
  href,
}: {
  theme: Theme;
  label: string;
  href: string;
}) {
  return (
    <Pressable onPress={() => Linking.openURL(href)} style={{ paddingVertical: 6 }}>
      <ThemedText style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
        ↗ {label}
      </ThemedText>
    </Pressable>
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
    title: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.muted,
    },
    body: {
      gap: 12,
    },
  });

const stepStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 14,
      alignItems: "flex-start",
    },
    badge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: theme.accent,
      fontWeight: "700",
      fontSize: 14,
    },
    text: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
    body: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.muted,
    },
  });

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    scroll: {
      padding: 20,
      gap: 20,
      paddingBottom: 64,
    },
    header: {
      paddingTop: 12,
      paddingBottom: 4,
      gap: 4,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.accent,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: 36,
      color: theme.text,
      fontFamily: Fonts?.rounded,
    },
    tagline: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: theme.muted,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.muted,
    },
    langRow: {
      flexDirection: "row",
      gap: 12,
    },
    logoutButton: {
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.danger,
      backgroundColor: theme.danger + "11",
      alignItems: "center",
    },
    logoutText: {
      color: theme.danger,
      fontWeight: "700",
      fontSize: 15,
    },
  });
}

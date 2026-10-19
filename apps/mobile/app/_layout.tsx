import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <I18nProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <RootGate />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

/**
 * Renders the navigator + redirects between (auth) and (tabs) based on the
 * current auth status. Lives inside the providers so it can call `useAuth()`.
 */
function RootGate() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status === "loading") return;

    // Expo Router's typed `segments[0]` doesn't yet include the (auth) group
    // because typed routes regenerate from the file tree on the next start.
    // Compare via string to keep this working before that regeneration.
    const inAuthGroup = (segments[0] as string) === "(auth)";
    if (status === "anonymous" && !inAuthGroup) {
      router.replace("/(auth)/login" as never);
    } else if (status === "authed" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [status, segments, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="result-detail"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}

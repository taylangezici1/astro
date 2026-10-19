/**
 * Small JSON wrappers over AsyncStorage for user preferences. Every call is
 * best-effort: storage failures fall back to defaults instead of breaking a
 * screen, because nothing stored here is essential.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadJSON<T>(key: string, isValid: (value: unknown) => value is T): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort.
  }
}

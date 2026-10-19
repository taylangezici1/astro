/**
 * Auth token persistence backed by AsyncStorage.
 *
 * The token is the only thing we persist — the user object is re-fetched via
 * /auth/me at boot using the stored token. That way the user row stays fresh
 * (including newly cached natal positions) without us having to invalidate a
 * second cache.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "synastry.authToken";

export async function loadToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Best-effort: persistence failure shouldn't break the in-memory session.
  }
}

export async function clearToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Same — best-effort.
  }
}

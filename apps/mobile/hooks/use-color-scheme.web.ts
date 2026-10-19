import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * To support static rendering, the server render (and the hydration pass that
 * must match it) always uses light; the real scheme applies once hydrated.
 * Like the native hook, anything but "dark" counts as light.
 */
export function useColorScheme(): 'light' | 'dark' {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated && colorScheme === 'dark' ? 'dark' : 'light';
}

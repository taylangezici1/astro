/**
 * Returns the full semantic palette for the active color scheme.
 *
 * Use this for any new component code instead of `useThemeColor`, which only
 * returns one base token at a time. Existing themed-text/themed-view stay on
 * `useThemeColor` for backwards compatibility with the Expo starter.
 */

import { Colors, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): Theme {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

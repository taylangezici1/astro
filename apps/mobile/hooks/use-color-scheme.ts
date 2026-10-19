import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * The app has light and dark palettes only; React Native can also report
 * "unspecified" (or nothing), which we treat as light.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}

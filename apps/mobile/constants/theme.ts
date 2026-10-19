/**
 * Project Synastry palette.
 *
 * Two layers of tokens:
 *
 *   1. Base colors (`text`, `background`, `tint`, `icon`, ...) — kept for
 *      backwards compatibility with the Expo starter components and
 *      `useThemeColor`. Don't add new code that depends on these directly.
 *   2. Semantic tokens (`surface`, `border`, `accent`, `accentSoft`,
 *      `inputBackground`, `muted`, `danger`, `gradientFrom`, `gradientTo`)
 *      — use these via `useTheme()` for everything else.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6c5ce7'; // indigo
const tintColorDark = '#a899ff';

/**
 * Structural shape of one theme. Defined explicitly so light/dark can both
 * be assigned to it without TypeScript narrowing each value to its literal.
 */
export interface Theme {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  muted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentBorder: string;
  gold: string;
  danger: string;
  success: string;
  gradientFrom: string;
  gradientTo: string;
}

export const Colors: { light: Theme; dark: Theme } = {
  light: {
    // base — required by useThemeColor
    text: '#1a1530',
    background: '#fbfaff',
    tint: tintColorLight,
    icon: '#5e5b7a',
    tabIconDefault: '#9590b3',
    tabIconSelected: tintColorLight,

    // semantic
    surface: '#ffffff',
    surfaceMuted: '#f2efff',
    border: '#e3dffb',
    inputBackground: '#ffffff',
    inputBorder: '#d6d0f0',
    placeholder: '#9590b3',
    muted: '#6e6a89',
    accent: tintColorLight,
    accentText: '#ffffff',
    accentSoft: '#ece8ff',
    accentBorder: '#c7bdf5',
    gold: '#f5b942',
    danger: '#e74c3c',
    success: '#2ecc71',

    // hero gradient
    gradientFrom: '#7a6bff',
    gradientTo: '#b46bff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0d0a1f',
    tint: tintColorDark,
    icon: '#9b97c2',
    tabIconDefault: '#6c688a',
    tabIconSelected: tintColorDark,

    surface: '#171232',
    surfaceMuted: '#1f1942',
    border: '#2c2557',
    inputBackground: '#1a1538',
    inputBorder: '#3a3168',
    placeholder: '#6c688a',
    muted: '#9b97c2',
    accent: tintColorDark,
    accentText: '#0d0a1f',
    accentSoft: 'rgba(168, 153, 255, 0.18)',
    accentBorder: 'rgba(168, 153, 255, 0.45)',
    gold: '#f5c456',
    danger: '#ff7568',
    success: '#5eead4',

    gradientFrom: '#5b4dd6',
    gradientTo: '#9658d9',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

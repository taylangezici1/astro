/**
 * Unicode astrological glyphs for planets, zodiac signs, and aspects.
 */

import type { AspectName, PlanetKey } from "@/lib/api";

export const PLANET_GLYPHS: Record<PlanetKey, string> = {
  sun: "\u2609",      // ☉
  moon: "\u263D",     // ☽
  mercury: "\u263F",  // ☿
  venus: "\u2640",    // ♀
  mars: "\u2642",     // ♂
  jupiter: "\u2643",  // ♃
  saturn: "\u2644",   // ♄
};

export const ZODIAC_GLYPHS: string[] = [
  "\u2648", // ♈ Aries
  "\u2649", // ♉ Taurus
  "\u264A", // ♊ Gemini
  "\u264B", // ♋ Cancer
  "\u264C", // ♌ Leo
  "\u264D", // ♍ Virgo
  "\u264E", // ♎ Libra
  "\u264F", // ♏ Scorpio
  "\u2650", // ♐ Sagittarius
  "\u2651", // ♑ Capricorn
  "\u2652", // ♒ Aquarius
  "\u2653", // ♓ Pisces
];

export const ASPECT_GLYPHS: Record<AspectName, string> = {
  conjunction: "\u260C", // ☌
  sextile: "\u26B9",    // ⚹
  square: "\u25A1",     // □
  trine: "\u25B3",      // △
  opposition: "\u260D", // ☍
};

/** Zodiac sign colours — one per sign, ordered Aries..Pisces. */
export const ZODIAC_COLORS: string[] = [
  "#e74c3c", // Aries — fire red
  "#8b6e4e", // Taurus — earth brown
  "#f0c040", // Gemini — air gold
  "#6cb4ee", // Cancer — water blue
  "#ff9500", // Leo — fire orange
  "#7a9b6e", // Virgo — earth green
  "#e6a8d7", // Libra — air pink
  "#8b2252", // Scorpio — water deep rose
  "#d45d00", // Sagittarius — fire burnt orange
  "#5e5e5e", // Capricorn — earth slate
  "#4ecdc4", // Aquarius — air teal
  "#6c5ce7", // Pisces — water indigo
];

/** Planet colours for chart dots. */
export const PLANET_COLORS: Record<PlanetKey, string> = {
  sun: "#f5b942",
  moon: "#c0c0c0",
  mercury: "#a899ff",
  venus: "#e6a8d7",
  mars: "#e74c3c",
  jupiter: "#ff9500",
  saturn: "#7a9b6e",
};

/** Get the zodiac sign index (0–11) from an ecliptic longitude. */
export function signIndex(longitude: number): number {
  return Math.floor(((longitude % 360) + 360) % 360 / 30);
}

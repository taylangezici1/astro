/**
 * Display helpers shared by the match form and results view.
 *
 * Each function takes the active `Translations` table so callers stay simple
 * (just call them after `useT()`).
 */

import type { PlanetKey } from "@/lib/api";
import type { Translations } from "@/lib/i18n/strings";

/** Convert an ecliptic longitude to "23°45′ Scorpio" / "23°45′ Akrep" style text. */
export function formatDegreeAsSign(longitude: number, t: Translations): string {
  const wrapped = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(wrapped / 30);
  const degreesInSign = wrapped - signIndex * 30;
  const deg = Math.floor(degreesInSign);
  const min = Math.floor((degreesInSign - deg) * 60);
  return `${deg}°${min.toString().padStart(2, "0")}′ ${t.zodiac[signIndex]}`;
}

export const PLANET_ORDER: PlanetKey[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

/** Localized planet display name. */
export function planetLabel(planet: PlanetKey, t: Translations): string {
  return t.planets[planet];
}

/** "October 12, 1994 · 14:15 UTC" or the Turkish equivalent. */
export function formatMatchTimestamp(iso: string, t: Translations): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(t.localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${date} · ${hh}:${mm} UTC`;
}

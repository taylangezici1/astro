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

/**
 * "May 4, 2022 · 04:00" from a wall-clock "YYYY-MM-DDTHH:mm:ss" string. The
 * server already converted to the right timezone, so no timezone math here —
 * formatting the date as UTC just stops the device's own zone shifting it.
 */
export function formatLocalDateTime(localISO: string, t: Translations): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localISO);
  if (!m) return localISO;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const day = date.toLocaleDateString(t.localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${day} · ${m[4]}:${m[5]}`;
}

/** A 0..1 fit as a whole number out of 100. */
export function toScore(fit: number): number {
  return Math.round(fit * 100);
}

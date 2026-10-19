/**
 * @synastry/ephemeris — thin, typed wrapper around the `sweph` Swiss Ephemeris
 * binding. Centralises planet definitions and Julian Day conversions so the
 * seeder, the natal-chart service, and the matching engine all agree on what
 * "Venus's longitude" means.
 *
 * Uses the Moshier ephemeris (SEFLG_MOSEPH) — pure-math, no data files needed,
 * accurate to ~0.1" for the Sun and a few arc-seconds for the Moon, which is
 * well inside the ±3° "orb" tolerance from workflow.md §3.
 */

import * as path from "node:path";
import {
  calc_ut,
  houses_ex2,
  julday,
  set_ephe_path,
  constants,
  close as swephClose,
} from "sweph";
import type { PlanetKey, PlanetaryChart } from "@synastry/api-types";

// Re-export so existing imports from @synastry/ephemeris keep working without
// every consumer having to learn about the new package.
export type { PlanetKey, PlanetaryChart };

// ---------- planet table ----------

export const PLANETS: ReadonlyArray<{ key: PlanetKey; id: number }> = [
  { key: "sun", id: constants.SE_SUN },
  { key: "moon", id: constants.SE_MOON },
  { key: "mercury", id: constants.SE_MERCURY },
  { key: "venus", id: constants.SE_VENUS },
  { key: "mars", id: constants.SE_MARS },
  { key: "jupiter", id: constants.SE_JUPITER },
  { key: "saturn", id: constants.SE_SATURN },
];

export const FLAGS = constants.SEFLG_MOSEPH;

// ---------- init ----------

let initialised = false;

/**
 * Idempotently configure the Swiss Ephemeris binding. Moshier mode doesn't
 * read files, but the binding still expects a path to be set once per process.
 */
export function initEphemeris(ephePath?: string): void {
  if (initialised) return;
  set_ephe_path(ephePath ?? path.resolve(__dirname, "../.swisseph"));
  initialised = true;
}

/** Release the binding's internal state. Call once on process shutdown. */
export function closeEphemeris(): void {
  swephClose();
  initialised = false;
}

// ---------- conversions ----------

/** Convert a JS Date (UTC) to Julian Day in UT. */
export function dateToJulianDayUT(d: Date): number {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const ut =
    d.getUTCHours() +
    d.getUTCMinutes() / 60 +
    d.getUTCSeconds() / 3600;
  return julday(year, month, day, ut, constants.SE_GREG_CAL);
}

// ---------- planet calculation ----------

/** Calculate one planet's ecliptic longitude (degrees, 0–360). */
export function calcLongitude(jdUt: number, planetId: number): number {
  const result = calc_ut(jdUt, planetId, FLAGS);
  if (result.flag !== FLAGS) {
    throw new Error(
      `sweph.calc_ut failed for planet ${planetId} at jd=${jdUt}: ${result.error || "unknown error"}`,
    );
  }
  // result.data = [longitude, latitude, distance, ...]
  return result.data[0];
}

/** Calculate the full 7-planet chart for a given UTC instant. */
export function calcChart(timestamp: Date): PlanetaryChart {
  initEphemeris();
  const jd = dateToJulianDayUT(timestamp);
  const chart = {} as PlanetaryChart;
  for (const planet of PLANETS) {
    chart[planet.key] = calcLongitude(jd, planet.id);
  }
  return chart;
}

// ---------- houses ----------

/**
 * The 12 house cusp longitudes, in zodiacal order. cusps[0] is the
 * Ascendant (1st-house cusp), cusps[1] the 2nd house, …
 */
export type HouseCusps = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Numbered house, 1..12. */
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Calculate the 12 Placidus house cusps for a birth instant + location.
 *
 * The "P" Placidus system matches the workflow.md spec and is the dominant
 * Western astrology default. We pass `iflag=0` because the cusps depend only
 * on time + geography, not on which ephemeris is loaded.
 */
export function calcHouses(
  timestamp: Date,
  latitude: number,
  longitude: number,
): HouseCusps {
  initEphemeris();
  const jd = dateToJulianDayUT(timestamp);
  const result = houses_ex2(jd, 0, latitude, longitude, "P");
  if (result.error) {
    throw new Error(
      `sweph.houses_ex2 failed at jd=${jd} lat=${latitude} lon=${longitude}: ${result.error}`,
    );
  }
  // The HousesList tuple is exactly 12 numbers in cusp order — cast to our
  // narrower readonly tuple type.
  return result.data.houses as unknown as HouseCusps;
}

/**
 * Determine which house (1..12) a given ecliptic longitude falls in,
 * given a set of cusps. Houses run forward in zodiacal order with
 * wraparound at 0°/360°.
 */
export function houseOf(longitude: number, cusps: HouseCusps): HouseNumber {
  const lon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start < end) {
      if (lon >= start && lon < end) return (i + 1) as HouseNumber;
    } else {
      // Wraparound across 0°.
      if (lon >= start || lon < end) return (i + 1) as HouseNumber;
    }
  }
  // Defensive fallback — should be unreachable for finite inputs.
  return 1;
}

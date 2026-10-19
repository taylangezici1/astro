/**
 * Resolves geographic coordinates to IANA timezones and converts local
 * birth-time inputs into UTC instants for the matching pipeline.
 *
 * Why this lives on the server, not the mobile client:
 *   - tz-lookup ships ~150 KB of polygon data; we only want one copy.
 *   - luxon brings IANA time zone math via the host runtime's Intl support;
 *     Node has full Intl, React Native does not (without hermes-intl).
 *   - The API contract becomes "give us the user's literal local birth time"
 *     which is far more honest than asking clients to pre-convert to UTC.
 */

import { Injectable, BadRequestException } from "@nestjs/common";
import { DateTime } from "luxon";
// tz-lookup is a CommonJS module; the default export is the function itself.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tzLookup: (lat: number, lng: number) => string = require("tz-lookup");

export interface LocalBirthInstant {
  /** YYYY-MM-DD, e.g. "1994-10-12". */
  localDate: string;
  /** HH:MM (24-hour), e.g. "14:15". */
  localTime: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedBirthInstant {
  /** Native UTC Date that the rest of the pipeline operates on. */
  utc: Date;
  /** IANA TZ name (e.g. "Europe/Istanbul") that we resolved. */
  timezone: string;
  /** Echo of the canonical local timestamp string we parsed. */
  localISO: string;
  /** ISO-8601 UTC string. Useful for cache keys and response payloads. */
  utcISO: string;
}

@Injectable()
export class TimezoneService {
  /**
   * Cache lat/lng → IANA TZ. tz-lookup is fast (~10 µs per call) but the
   * district set is small and effectively static, so a Map keyed by rounded
   * coordinates removes even that overhead during request bursts.
   */
  private readonly tzCache = new Map<string, string>();

  /** Resolve a (lat, lng) to an IANA timezone name. */
  resolveZone(latitude: number, longitude: number): string {
    // Round to 4 decimal places (~11 m precision) for cache key stability.
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const hit = this.tzCache.get(key);
    if (hit) return hit;

    let zone: string;
    try {
      zone = tzLookup(latitude, longitude);
    } catch (err) {
      throw new BadRequestException(
        `Could not resolve a timezone for (${latitude}, ${longitude}): ${(err as Error).message}`,
      );
    }
    this.tzCache.set(key, zone);
    return zone;
  }

  /**
   * Convert a local birth instant (in the timezone of its coordinates) to a
   * UTC Date suitable for Swiss Ephemeris calculations.
   *
   * @throws BadRequestException if the local timestamp is invalid (e.g.
   *   2:30 AM during a DST forward jump that doesn't exist in the wall clock).
   */
  resolveLocalInstant(input: LocalBirthInstant): ResolvedBirthInstant {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.localDate)) {
      throw new BadRequestException(
        `birthLocalDate must be YYYY-MM-DD, got "${input.localDate}"`,
      );
    }
    if (!/^\d{2}:\d{2}$/.test(input.localTime)) {
      throw new BadRequestException(
        `birthLocalTime must be HH:MM, got "${input.localTime}"`,
      );
    }

    const zone = this.resolveZone(input.latitude, input.longitude);
    const localISO = `${input.localDate}T${input.localTime}:00`;

    const dt = DateTime.fromISO(localISO, { zone });
    if (!dt.isValid) {
      throw new BadRequestException(
        `Local instant ${localISO} is invalid in ${zone}: ${dt.invalidReason} ${dt.invalidExplanation ?? ""}`.trim(),
      );
    }

    // DST gap detection. Luxon's default behaviour for a non-existent wall
    // clock (e.g. 02:30 on a spring-forward day) is to silently snap forward
    // to the next valid instant. That's a real correctness bug for natal
    // charts — refuse the input instead.
    const roundTrip = dt.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    if (roundTrip !== localISO) {
      throw new BadRequestException(
        `Local instant ${localISO} does not exist in ${zone} ` +
          `(likely a DST forward jump). Closest valid instant would be ${roundTrip}.`,
      );
    }

    const utc = dt.toUTC();
    return {
      utc: utc.toJSDate(),
      timezone: zone,
      localISO,
      utcISO: utc.toISO() ?? "",
    };
  }
}

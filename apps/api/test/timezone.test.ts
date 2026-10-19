import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { TimezoneService } from "../src/timezone/timezone.service";

const tz = new TimezoneService();

const IZMIR = { latitude: 38.4192, longitude: 27.1287 };
const NEW_YORK = { latitude: 40.7128, longitude: -74.006 };

describe("TimezoneService.resolveZone", () => {
  it("resolves İzmir to Europe/Istanbul", () => {
    expect(tz.resolveZone(IZMIR.latitude, IZMIR.longitude)).toBe(
      "Europe/Istanbul",
    );
  });

  it("resolves New York to America/New_York", () => {
    expect(tz.resolveZone(NEW_YORK.latitude, NEW_YORK.longitude)).toBe(
      "America/New_York",
    );
  });

  it("caches identical lookups", () => {
    const a = tz.resolveZone(IZMIR.latitude, IZMIR.longitude);
    const b = tz.resolveZone(IZMIR.latitude, IZMIR.longitude);
    expect(a).toBe(b);
  });
});

describe("TimezoneService.resolveLocalInstant", () => {
  it("converts İzmir local time to UTC using the standard offset", () => {
    // 1994-10-12 was AFTER Turkey's 1994 DST end (Sep 25), so the offset is
    // UTC+2 (TRT standard time), not UTC+3.
    const result = tz.resolveLocalInstant({
      localDate: "1994-10-12",
      localTime: "17:15",
      latitude: IZMIR.latitude,
      longitude: IZMIR.longitude,
    });
    expect(result.timezone).toBe("Europe/Istanbul");
    expect(result.localISO).toBe("1994-10-12T17:15:00");
    expect(result.utcISO).toBe("1994-10-12T15:15:00.000Z");
    expect(result.utc.toISOString()).toBe("1994-10-12T15:15:00.000Z");
  });

  it("uses the DST offset on a date inside the DST window", () => {
    // 1994-07-01 in İzmir → DST in effect → UTC+3.
    const result = tz.resolveLocalInstant({
      localDate: "1994-07-01",
      localTime: "12:00",
      latitude: IZMIR.latitude,
      longitude: IZMIR.longitude,
    });
    expect(result.utcISO).toBe("1994-07-01T09:00:00.000Z");
  });

  it("converts New York local time across the DST boundary", () => {
    // March 13, 2022 — DST started; 2:30 AM didn't exist (spring forward).
    expect(() =>
      tz.resolveLocalInstant({
        localDate: "2022-03-13",
        localTime: "02:30",
        latitude: NEW_YORK.latitude,
        longitude: NEW_YORK.longitude,
      }),
    ).toThrow(BadRequestException);
  });

  it("uses a caller-supplied zone instead of the coordinate lookup", () => {
    // Hopa, Artvin: tz-lookup says Asia/Tbilisi (UTC+4); Türkiye is UTC+3.
    const result = tz.resolveLocalInstant({
      localDate: "2020-06-15",
      localTime: "15:00",
      latitude: 41.39,
      longitude: 41.42,
      timezone: "Europe/Istanbul",
    });
    expect(result.timezone).toBe("Europe/Istanbul");
    expect(result.utcISO).toBe("2020-06-15T12:00:00.000Z");
  });

  it("tags a DST-gap rejection with a machine-readable code", () => {
    try {
      tz.resolveLocalInstant({
        localDate: "2022-03-13",
        localTime: "02:30",
        latitude: NEW_YORK.latitude,
        longitude: NEW_YORK.longitude,
      });
      expect.unreachable();
    } catch (err) {
      expect((err as BadRequestException).getResponse()).toMatchObject({
        statusCode: 400,
        code: "BIRTH_TIME_IN_DST_GAP",
      });
    }
  });

  it("rejects malformed local date strings", () => {
    expect(() =>
      tz.resolveLocalInstant({
        localDate: "not-a-date",
        localTime: "12:00",
        latitude: IZMIR.latitude,
        longitude: IZMIR.longitude,
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects malformed local time strings", () => {
    expect(() =>
      tz.resolveLocalInstant({
        localDate: "1994-10-12",
        localTime: "1715",
        latitude: IZMIR.latitude,
        longitude: IZMIR.longitude,
      }),
    ).toThrow(BadRequestException);
  });
});

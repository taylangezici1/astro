/**
 * Seeds the GlobalSky table — Phase 1 of the matching pipeline (workflow.md §4).
 *
 * Strategy:
 *   - Walk every 15-minute UTC tick from --start to --end (default: last 40 years).
 *   - For each tick, ask Swiss Ephemeris for the ecliptic longitude of the seven
 *     visible planets (Sun..Saturn).
 *   - Batch-insert into GlobalSky with `skipDuplicates`, so re-running the
 *     seeder is safe and resumable.
 *
 * Usage:
 *   yarn workspace @synastry/database seed                 # full 40-year window
 *   yarn workspace @synastry/database seed --years=1       # last 12 months only
 *   yarn workspace @synastry/database seed --start=2000-01-01 --end=2001-01-01
 */

import "dotenv/config";
import {
  calcChart,
  closeEphemeris,
  initEphemeris,
  PLANETS,
  type PlanetaryChart,
} from "@synastry/ephemeris";

import { prisma } from "../src/index";

type SkyRow = { timestamp: Date } & PlanetaryChart;

const STEP_MINUTES = 15;
const BATCH_SIZE = 2_000;

// ---------- arg parsing ----------

interface Args {
  start: Date;
  end: Date;
}

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss" as UTC, regardless of host TZ. */
function parseUtc(input: string): Date {
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(input);
  return new Date(hasTz ? input : `${input}Z`);
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const map = new Map<string, string>();
  for (const arg of argv) {
    const m = /^--([^=]+)=(.+)$/.exec(arg);
    if (m) map.set(m[1], m[2]);
  }

  const now = new Date();
  // Snap "now" down to the nearest 15-minute boundary so the loop terminates cleanly.
  now.setUTCSeconds(0, 0);
  now.setUTCMinutes(now.getUTCMinutes() - (now.getUTCMinutes() % STEP_MINUTES));

  let start: Date;
  let end: Date;

  if (map.has("years")) {
    const years = Number(map.get("years"));
    if (!Number.isFinite(years) || years <= 0) {
      throw new Error(`--years must be a positive number, got ${map.get("years")}`);
    }
    end = now;
    start = new Date(now);
    start.setUTCFullYear(start.getUTCFullYear() - years);
  } else if (map.has("start") || map.has("end")) {
    if (!map.has("start") || !map.has("end")) {
      throw new Error("--start and --end must be provided together");
    }
    start = parseUtc(map.get("start")!);
    end = parseUtc(map.get("end")!);
  } else {
    // Default: 40-year historical window (workflow.md §1.A).
    end = now;
    start = new Date(now);
    start.setUTCFullYear(start.getUTCFullYear() - 40);
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid --start or --end date");
  }
  if (start >= end) {
    throw new Error("--start must be earlier than --end");
  }
  return { start, end };
}

// ---------- main ----------

async function main() {
  const { start, end } = parseArgs();
  initEphemeris();

  const totalSteps = Math.floor(
    (end.getTime() - start.getTime()) / (STEP_MINUTES * 60_000),
  );
  console.log(
    `Seeding GlobalSky: ${start.toISOString()} → ${end.toISOString()} ` +
      `(${totalSteps.toLocaleString()} ticks @ ${STEP_MINUTES}-min steps)`,
  );

  // Resume support: skip ticks we've already seeded.
  const existing = await prisma.globalSky.findFirst({
    where: { timestamp: { gte: start, lt: end } },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  let cursor = new Date(start);
  if (existing) {
    cursor = new Date(existing.timestamp.getTime() + STEP_MINUTES * 60_000);
    console.log(`  resuming from ${cursor.toISOString()}`);
  }

  let buffer: SkyRow[] = [];
  let inserted = 0;
  let processed = 0;
  const t0 = Date.now();

  const flush = async () => {
    if (buffer.length === 0) return;
    const result = await prisma.globalSky.createMany({
      data: buffer,
      skipDuplicates: true,
    });
    inserted += result.count;
    buffer = [];
  };

  while (cursor < end) {
    const chart = calcChart(cursor);
    buffer.push({ timestamp: cursor, ...chart });
    processed++;

    if (buffer.length >= BATCH_SIZE) {
      await flush();
      const elapsed = (Date.now() - t0) / 1000;
      const rate = processed / elapsed;
      const remaining = totalSteps - processed;
      const etaMin = rate > 0 ? remaining / rate / 60 : 0;
      console.log(
        `  ${processed.toLocaleString()}/${totalSteps.toLocaleString()} ticks ` +
          `(${inserted.toLocaleString()} inserted, ${rate.toFixed(0)}/s, eta ${etaMin.toFixed(1)}m)`,
      );
    }

    cursor = new Date(cursor.getTime() + STEP_MINUTES * 60_000);
  }

  await flush();
  console.log(
    `Done. ${inserted.toLocaleString()} new rows in ${((Date.now() - t0) / 1000).toFixed(1)}s.`,
  );

  // PLANETS is exported only for the seeder side-channel; reference it so the
  // re-export survives unused-import linters in the future.
  void PLANETS;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    closeEphemeris();
  });

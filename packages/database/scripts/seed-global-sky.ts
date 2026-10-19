/**
 * Seeds the GlobalSky table — Phase 1 of the matching pipeline (workflow.md §4).
 *
 * Strategy:
 *   - Walk every 15-minute UTC tick from --start to --end (default: last 40 years).
 *   - For each tick, ask Swiss Ephemeris for the ecliptic longitude of the seven
 *     visible planets (Sun..Saturn).
 *   - Work in 30-day chunks, skipping chunks that are already complete, so
 *     re-running is cheap and any gaps get filled (see sky-seeder.ts).
 *
 * Usage:
 *   yarn workspace @synastry/database seed                 # full 40-year window
 *   yarn workspace @synastry/database seed --years=1       # last 12 months only
 *   yarn workspace @synastry/database seed --start=2000-01-01 --end=2001-01-01
 */

import "dotenv/config";
import { calcChart, closeEphemeris, initEphemeris } from "@synastry/ephemeris";

import { prisma } from "../src/index";
import { STEP_MS, seedSky } from "./sky-seeder";

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

  // Snap "now" down to a 15-minute boundary so the window ends on the grid.
  const now = new Date(Math.floor(Date.now() / STEP_MS) * STEP_MS);

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

  const totalTicks = Math.floor((end.getTime() - start.getTime()) / STEP_MS);
  console.log(
    `Seeding GlobalSky: ${start.toISOString()} → ${end.toISOString()} ` +
      `(${totalTicks.toLocaleString()} ticks @ 15-min steps)`,
  );

  const t0 = Date.now();
  const summary = await seedSky(start, end, {
    countExisting: (from, to) =>
      prisma.globalSky.count({ where: { timestamp: { gte: from, lt: to } } }),
    insert: async (rows) =>
      (await prisma.globalSky.createMany({ data: rows, skipDuplicates: true })).count,
    chartAt: calcChart,
    log: (message) => console.log(message),
  });

  console.log(
    `Done. ${summary.inserted.toLocaleString()} new rows in ${((Date.now() - t0) / 1000).toFixed(1)}s ` +
      `(${summary.chunksSeeded} chunks seeded, ${summary.chunksSkipped} already complete).`,
  );
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

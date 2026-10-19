import { describe, expect, it } from "vitest";
import type { PlanetaryChart } from "@synastry/ephemeris";

import {
  STEP_MS,
  alignUp,
  chunkWindow,
  seedSky,
  type SkyRow,
  type SkySeederDeps,
} from "../scripts/sky-seeder";

const DAY = 24 * 60 * 60_000;
const CHUNK = 7 * DAY;

const FAKE_CHART: PlanetaryChart = {
  sun: 1, moon: 2, mercury: 3, venus: 4, mars: 5, jupiter: 6, saturn: 7,
};

/** An in-memory GlobalSky keyed by timestamp. */
function fakeTable() {
  const rows = new Map<number, SkyRow>();
  let chartCalls = 0;
  const deps: SkySeederDeps = {
    countExisting: async (start, end) =>
      [...rows.keys()].filter((t) => t >= start.getTime() && t < end.getTime()).length,
    insert: async (batch) => {
      let added = 0;
      for (const row of batch) {
        if (!rows.has(row.timestamp.getTime())) {
          rows.set(row.timestamp.getTime(), row);
          added++;
        }
      }
      return added;
    },
    chartAt: () => {
      chartCalls++;
      return FAKE_CHART;
    },
  };
  return { rows, deps, chartCalls: () => chartCalls };
}

const ticksBetween = (start: Date, end: Date) => (end.getTime() - start.getTime()) / STEP_MS;

describe("alignUp", () => {
  it("rounds up to the next 15-minute boundary", () => {
    expect(alignUp(new Date("2000-01-01T00:07:00Z")).toISOString()).toBe("2000-01-01T00:15:00.000Z");
    expect(alignUp(new Date("2000-01-01T00:15:00Z")).toISOString()).toBe("2000-01-01T00:15:00.000Z");
  });
});

describe("chunkWindow", () => {
  it("tiles the window exactly, with a short final chunk", () => {
    const start = new Date("2000-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 2.5 * CHUNK);
    const chunks = chunkWindow(start, end, CHUNK);

    expect(chunks).toHaveLength(3);
    expect(chunks[0].start).toEqual(start);
    expect(chunks.at(-1)!.end).toEqual(end);
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].start).toEqual(chunks[i - 1].end);
    }
    expect(chunks.reduce((n, c) => n + c.ticks, 0)).toBe(ticksBetween(start, end));
  });
});

describe("seedSky", () => {
  const start = new Date("2000-01-01T00:00:00Z");
  const end = new Date("2000-03-01T00:00:00Z");

  it("fills an empty window with one row per tick", async () => {
    const table = fakeTable();
    const summary = await seedSky(start, end, table.deps, { chunkMs: CHUNK });
    expect(summary.inserted).toBe(ticksBetween(start, end));
    expect(table.rows.size).toBe(ticksBetween(start, end));
  });

  it("skips complete chunks on a re-run without recomputing them", async () => {
    const table = fakeTable();
    await seedSky(start, end, table.deps, { chunkMs: CHUNK });
    const callsAfterFirstRun = table.chartCalls();

    const summary = await seedSky(start, end, table.deps, { chunkMs: CHUNK });
    expect(summary.inserted).toBe(0);
    expect(summary.chunksSeeded).toBe(0);
    expect(table.chartCalls()).toBe(callsAfterFirstRun);
  });

  it("fills the older part of the window after a recent-only seed", async () => {
    // Regression: the old resume logic started after the newest existing row,
    // so a full seed after a `--years=1` seed skipped everything older.
    const table = fakeTable();
    const recentStart = new Date("2000-02-15T00:00:00Z");
    await seedSky(recentStart, end, table.deps, { chunkMs: CHUNK });

    await seedSky(start, end, table.deps, { chunkMs: CHUNK });
    expect(table.rows.size).toBe(ticksBetween(start, end));
    expect(table.rows.has(start.getTime())).toBe(true);
  });

  it("completes a partially seeded chunk, e.g. after an interrupted run", async () => {
    const table = fakeTable();
    await seedSky(start, new Date(start.getTime() + 3 * DAY), table.deps, { chunkMs: CHUNK });

    const summary = await seedSky(start, end, table.deps, { chunkMs: CHUNK });
    expect(summary.inserted).toBe(ticksBetween(start, end) - (3 * DAY) / STEP_MS);
    expect(table.rows.size).toBe(ticksBetween(start, end));
  });

  it("only writes timestamps on the 15-minute grid", async () => {
    const table = fakeTable();
    await seedSky(new Date("2000-01-01T00:07:00Z"), new Date("2000-01-01T02:00:00Z"), table.deps);
    for (const t of table.rows.keys()) expect(t % STEP_MS).toBe(0);
    expect(table.rows.size).toBe(7); // 00:15 … 01:45
  });
});

/**
 * GlobalSky seeding logic, separated from the CLI (seed-global-sky.ts) so it
 * can be tested without a database.
 *
 * The window is processed in fixed-size chunks. A chunk whose rows are all
 * present is skipped; any other chunk is recomputed and inserted with
 * duplicates ignored. That makes re-runs cheap, resumes interrupted runs, and
 * fills gaps anywhere in the window — e.g. a full 40-year seed after a
 * `--years=1` demo seed still fills the older 39 years.
 */

import type { PlanetaryChart } from "@synastry/ephemeris";

export const STEP_MS = 15 * 60_000;
/** 30 days of 15-minute ticks = 2 880 rows per chunk. */
export const DEFAULT_CHUNK_MS = 30 * 24 * 60 * 60_000;

export type SkyRow = { timestamp: Date } & PlanetaryChart;

export interface SkySeederDeps {
  /** Rows already stored with start <= timestamp < end. */
  countExisting(start: Date, end: Date): Promise<number>;
  /** Insert rows, ignoring ones already present. Resolves to the number added. */
  insert(rows: SkyRow[]): Promise<number>;
  chartAt(timestamp: Date): PlanetaryChart;
  log?(message: string): void;
}

export interface Chunk {
  start: Date;
  end: Date;
  /** Number of 15-minute ticks in [start, end). */
  ticks: number;
}

export interface SeedSummary {
  inserted: number;
  chunksSkipped: number;
  chunksSeeded: number;
}

/** Round a date up to the next 15-minute boundary (unchanged if on one). */
export function alignUp(date: Date): Date {
  return new Date(Math.ceil(date.getTime() / STEP_MS) * STEP_MS);
}

/** Split [start, end) into consecutive chunks aligned to the 15-minute grid. */
export function chunkWindow(start: Date, end: Date, chunkMs = DEFAULT_CHUNK_MS): Chunk[] {
  if (chunkMs % STEP_MS !== 0) throw new Error("chunkMs must be a multiple of 15 minutes");
  const chunks: Chunk[] = [];
  for (let t = alignUp(start).getTime(); t < end.getTime(); t += chunkMs) {
    const chunkEnd = Math.min(t + chunkMs, end.getTime());
    chunks.push({
      start: new Date(t),
      end: new Date(chunkEnd),
      ticks: Math.ceil((chunkEnd - t) / STEP_MS),
    });
  }
  return chunks;
}

export async function seedSky(
  start: Date,
  end: Date,
  deps: SkySeederDeps,
  options: { chunkMs?: number; batchSize?: number } = {},
): Promise<SeedSummary> {
  const batchSize = options.batchSize ?? 2_000;
  const chunks = chunkWindow(start, end, options.chunkMs);
  const summary: SeedSummary = { inserted: 0, chunksSkipped: 0, chunksSeeded: 0 };

  for (const [i, chunk] of chunks.entries()) {
    const existing = await deps.countExisting(chunk.start, chunk.end);
    if (existing >= chunk.ticks) {
      summary.chunksSkipped++;
      continue;
    }

    let batch: SkyRow[] = [];
    for (let t = chunk.start.getTime(); t < chunk.end.getTime(); t += STEP_MS) {
      const timestamp = new Date(t);
      batch.push({ timestamp, ...deps.chartAt(timestamp) });
      if (batch.length >= batchSize) {
        summary.inserted += await deps.insert(batch);
        batch = [];
      }
    }
    if (batch.length > 0) summary.inserted += await deps.insert(batch);
    summary.chunksSeeded++;

    deps.log?.(
      `  chunk ${i + 1}/${chunks.length} ${chunk.start.toISOString().slice(0, 10)}: ` +
        `${chunk.ticks - existing} missing, ${summary.inserted.toLocaleString()} inserted so far`,
    );
  }
  return summary;
}

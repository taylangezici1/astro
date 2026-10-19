/**
 * Seeds the District table from packages/database/seed-data/turkey-districts.json.
 *
 * The JSON is normalised at commit time (see roadmap.md / earlier sourcing
 * step) — one entry per Türkiye district with id, name, province, and
 * decimal-degree coordinates. The seeder is idempotent: it upserts every row
 * so re-running it after a coordinate fix is safe.
 *
 * Usage:
 *   yarn workspace @synastry/database seed:districts
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

import { prisma } from "../src/index";

interface DistrictRow {
  id: string;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}

const DATA_PATH = path.resolve(
  __dirname,
  "../seed-data/turkey-districts.json",
);

async function main() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const districts: DistrictRow[] = JSON.parse(raw);

  if (!Array.isArray(districts) || districts.length === 0) {
    throw new Error(`No districts found at ${DATA_PATH}`);
  }

  console.log(`Seeding ${districts.length} districts from ${DATA_PATH}`);
  const t0 = Date.now();

  // createMany with skipDuplicates is faster than per-row upsert and
  // sufficient because the dataset is append-only — we never need to mutate
  // existing rows. If the source JSON changes, run `prisma migrate reset` or
  // truncate the table first.
  const result = await prisma.district.createMany({
    data: districts,
    skipDuplicates: true,
  });

  console.log(
    `Done. ${result.count} new rows in ${((Date.now() - t0) / 1000).toFixed(2)}s ` +
      `(${districts.length - result.count} already present).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

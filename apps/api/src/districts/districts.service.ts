/**
 * In-memory cache + lookup over the District table.
 *
 * The full ~972-row dataset is small and effectively static, so we load it
 * once on boot and serve every read from RAM. Both the public /districts
 * endpoint and Phase 3's RefinementService consume this service so there is
 * exactly one source of truth (and one DB query) per process lifetime.
 */

import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { District } from "@synastry/api-types";
import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";

// Re-export so existing imports from this module keep working.
export type { District };

@Injectable()
export class DistrictsService implements OnModuleInit {
  private readonly logger = new Logger(DistrictsService.name);
  private districts: readonly District[] = [];

  constructor(@Inject(PRISMA) private readonly prisma: PrismaInstance) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.prisma.district.findMany({
      orderBy: [{ province: "asc" }, { name: "asc" }],
    });
    this.districts = rows;
    this.logger.log(`Loaded ${rows.length} districts into memory`);
  }

  /** Return the full sorted list. */
  all(): readonly District[] {
    return this.districts;
  }

  /**
   * Return districts whose name or province matches the supplied query,
   * accent- and case-insensitively. Empty / missing query returns the full
   * list (capped to `limit`).
   */
  search(query: string | undefined, limit = 50): District[] {
    const q = normalize(query ?? "").trim();
    if (!q) return this.districts.slice(0, limit);

    const out: District[] = [];
    for (const d of this.districts) {
      if (
        normalize(d.name).includes(q) ||
        normalize(d.province).includes(q)
      ) {
        out.push(d);
        if (out.length >= limit) break;
      }
    }
    return out;
  }
}

/**
 * Lowercase + strip Turkish-specific accents so "İzmir" matches "izmir" and
 * "Şanlıurfa" matches "sanliurfa". Falls back to NFD/diacritic stripping for
 * non-Turkish characters.
 */
function normalize(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

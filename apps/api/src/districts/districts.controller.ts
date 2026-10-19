import { Controller, Get, Query } from "@nestjs/common";
import type { DistrictsResponse } from "@synastry/api-types";
import { DistrictsService } from "./districts.service";

@Controller("districts")
export class DistrictsController {
  constructor(private readonly districts: DistrictsService) {}

  /**
   * Returns the full district list when called without a query, or up to
   * `limit` matches when `q` is provided. The full payload is small (~80 KB)
   * so the mobile client can fetch once on boot and filter locally without
   * hitting this endpoint per keystroke.
   */
  @Get()
  list(
    @Query("q") q?: string,
    @Query("limit") limitRaw?: string,
  ): DistrictsResponse {
    const limit = limitRaw ? Math.min(Math.max(Number(limitRaw) || 50, 1), 1000) : 1000;
    return { districts: this.districts.search(q, limit) };
  }
}

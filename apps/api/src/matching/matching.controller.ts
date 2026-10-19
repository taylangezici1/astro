import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import type { User as PrismaUser } from "@synastry/database";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MatchRequestDto } from "./dto/match-request.dto";
import { MatchingService, type MatchResult } from "./matching.service";

@Controller("match")
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /**
   * Phase 2 + Phase 3 entry point.
   *
   * Birth data is read off the authenticated user (cached at signup) — the
   * request body only carries the matching tunables. The JwtAuthGuard puts a
   * fresh User row on `request.user` after token validation.
   */
  @Post()
  @HttpCode(200)
  // Uncached matches cost ~0.7 s of DB + CPU; 20/min per IP is plenty for a
  // person tweaking settings and stops one client from hogging the server.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async match(
    @Req() req: Request,
    @Body() dto: MatchRequestDto,
  ): Promise<MatchResult> {
    const user = req.user as PrismaUser;
    return this.matching.findMatches(user, {
      rules: dto.rules,
      orb: dto.orb,
      limit: dto.limit,
      houseRules: dto.houseRules,
    });
  }
}

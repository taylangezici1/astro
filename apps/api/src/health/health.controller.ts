import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";

/**
 * Liveness + readiness for load balancers and the Docker HEALTHCHECK:
 * 200 when the process is up and Postgres answers, 503 otherwise.
 */
@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaInstance) {}

  @Get()
  async check(): Promise<{ status: "ok"; db: "up" }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
    return { status: "ok", db: "up" };
  }
}

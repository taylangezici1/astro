import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import * as path from "node:path";

import { PrismaModule } from "./prisma/prisma.module";
import { DistrictsModule } from "./districts/districts.module";
import { TimezoneModule } from "./timezone/timezone.module";
import { AuthModule } from "./auth/auth.module";
import { MatchingModule } from "./matching/matching.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Look for an .env in the api package first, then fall back to the
      // database package's .env so a single source of truth works for dev.
      envFilePath: [
        path.resolve(__dirname, "../.env"),
        path.resolve(__dirname, "../../../packages/database/.env"),
      ],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 24 * 60 * 60 * 1000, // 24h, per workflow.md §5
      max: 1_000,
    }),
    // Per-IP rate limit for every route; auth and matching tighten it with
    // @Throttle. In-memory, so per instance — like the match cache, it moves
    // to Redis once there is more than one API instance.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    DistrictsModule,
    TimezoneModule,
    AuthModule,
    MatchingModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

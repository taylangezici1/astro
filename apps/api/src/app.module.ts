import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import * as path from "node:path";

import { PrismaModule } from "./prisma/prisma.module";
import { DistrictsModule } from "./districts/districts.module";
import { TimezoneModule } from "./timezone/timezone.module";
import { AuthModule } from "./auth/auth.module";
import { MatchingModule } from "./matching/matching.module";

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
    PrismaModule,
    DistrictsModule,
    TimezoneModule,
    AuthModule,
    MatchingModule,
  ],
})
export class AppModule {}

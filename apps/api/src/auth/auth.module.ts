import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { DistrictsModule } from "../districts/districts.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule,
    DistrictsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error(
            "JWT_SECRET is not set. Add it to apps/api/.env before starting the API.",
          );
        }
        if (
          process.env.NODE_ENV === "production" &&
          (secret.length < 32 || secret === "change-me")
        ) {
          throw new Error(
            "JWT_SECRET is too weak for production. Use at least 32 random characters (openssl rand -hex 32).",
          );
        }
        return {
          secret,
          signOptions: { expiresIn: "30d" },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

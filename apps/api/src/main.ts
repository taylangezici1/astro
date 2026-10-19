import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: corsOptions(),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.disable("x-powered-by");
  // Behind a load balancer / reverse proxy, the client IP (used for rate
  // limiting) is in X-Forwarded-For. Set TRUST_PROXY to the number of proxy
  // hops in front of the API (usually 1); leave unset when exposed directly.
  if (process.env.TRUST_PROXY) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  }
  // Run onApplicationShutdown hooks (Prisma disconnect) on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  // Explicitly bind to 0.0.0.0 so physical devices on the LAN (Expo Go on a
  // phone) can reach the dev server, not just localhost.
  await app.listen(port, "0.0.0.0");
  Logger.log(`API listening on http://0.0.0.0:${port}`, "Bootstrap");
}

/**
 * Native apps don't send an Origin, so CORS only matters for the Expo web
 * build. CORS_ORIGINS is a comma-separated allowlist; unset allows any origin
 * (fine for development, set it in production if you serve the web build).
 */
function corsOptions(): { origin: string[] | boolean } {
  const origins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
  return { origin: origins && origins.length > 0 ? origins : true };
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap API:", err);
  process.exit(1);
});

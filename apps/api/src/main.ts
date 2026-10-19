import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  // Explicitly bind to 0.0.0.0 so physical devices on the LAN (Expo Go on a
  // phone) can reach the dev server, not just localhost.
  await app.listen(port, "0.0.0.0");
  Logger.log(`API listening on http://0.0.0.0:${port}`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap API:", err);
  process.exit(1);
});

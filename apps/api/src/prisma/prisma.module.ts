import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { prisma } from "@synastry/database";

/** Injection token for the shared Prisma client. */
export const PRISMA = Symbol("PRISMA");
export type PrismaInstance = typeof prisma;

@Global()
@Module({
  providers: [{ provide: PRISMA, useValue: prisma }],
  exports: [PRISMA],
})
export class PrismaModule implements OnApplicationShutdown {
  constructor(@Inject(PRISMA) private readonly client: PrismaInstance) {}

  /** Close the connection pool on SIGTERM (requires enableShutdownHooks). */
  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}

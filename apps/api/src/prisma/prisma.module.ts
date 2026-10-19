import { Global, Module } from "@nestjs/common";
import { prisma } from "@synastry/database";

/** Injection token for the shared Prisma client. */
export const PRISMA = Symbol("PRISMA");
export type PrismaInstance = typeof prisma;

@Global()
@Module({
  providers: [{ provide: PRISMA, useValue: prisma }],
  exports: [PRISMA],
})
export class PrismaModule {}

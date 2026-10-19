import { PrismaClient } from "@prisma/client";

// Re-export the generated types so consumers don't need a direct
// dependency on @prisma/client.
export * from "@prisma/client";

// In dev, hot-reload can spawn many PrismaClients. Cache one on globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaSingleton: PrismaClient | null = null;

function createPrismaClient() {
  // Prefer DIRECT_URL for serverless/API (avoids pgbouncer transaction limits with Prisma)
  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgresql://localhost:5432/thearc";
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (prismaSingleton) return prismaSingleton;
  prismaSingleton = global.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    global.prisma = prismaSingleton;
  }
  return prismaSingleton;
}

/**
 * Lazy proxy so importing `prisma` never blocks dev server startup.
 * The real client is created only when a method is accessed/called.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>;
    return client[prop];
  },
});

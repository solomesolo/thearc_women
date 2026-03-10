import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prefer DIRECT_URL for serverless/API (avoids pgbouncer transaction limits with Prisma)
const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const adapter = new PrismaPg({ connectionString });

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaSingleton: PrismaClient | null = null;

function createPrismaClient() {
  // Prefer DIRECT_URL first: pooler URLs (often DATABASE_URL on Supabase) can break @prisma/adapter-pg
  // and surface misleading errors like column "(not available)" does not exist.
  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgresql://localhost:5432/thearc";
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/**
 * True if this client was built from the current schema.
 * We defensively check a few representative model delegates so we don't reuse a
 * hot-reloaded global Prisma client that predates newer Engine tables.
 */
function clientHasCurrentSchema(client: unknown): boolean {
  const c = client as Record<string, unknown>;
  return (
    typeof c.articleView !== "undefined" &&
    typeof c.questionnaireDefinition !== "undefined" &&
    typeof c.recommendationInstance !== "undefined" &&
    typeof c.statusSnapshot !== "undefined" &&
    typeof c.actionOption !== "undefined" &&
    typeof c.healthScorePolicy !== "undefined" &&
    typeof c.userHealthScore !== "undefined"
  );
}

export function getPrisma(): PrismaClient {
  if (prismaSingleton && clientHasCurrentSchema(prismaSingleton)) {
    return prismaSingleton;
  }
  prismaSingleton = null;

  const candidate = global.prisma ?? createPrismaClient();
  // Do not reuse a global singleton that predates ArticleView — savedArticle alone is not enough.
  const client = clientHasCurrentSchema(candidate) ? candidate : createPrismaClient();
  prismaSingleton = client;

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

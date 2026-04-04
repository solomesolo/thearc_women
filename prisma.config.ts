import "dotenv/config";
import { defineConfig } from "prisma/config";

// Do not use prisma/config `env("DIRECT_URL")` here — it throws if unset, which breaks
// `prisma generate` on Vercel when only DATABASE_URL is configured.
// lib/db.ts already prefers DIRECT_URL ?? DATABASE_URL at runtime.
const datasourceUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://127.0.0.1:5432/prisma_config_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});

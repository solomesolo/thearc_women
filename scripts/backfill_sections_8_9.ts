/**
 * Backfill sections 8 (Action protocol) and 9 (Tracking framework) for articles
 * that only have 7 sections. Run once after adding the new section types.
 *
 * Usage: npx tsx scripts/backfill_sections_8_9.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config();
config({ path: ".env.local" });
const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SECTION_8_TITLE = "Action protocol";
const SECTION_9_TITLE = "Tracking framework";
const PLACEHOLDER_BODY = "Content will be generated.";
const PLACEHOLDER_PREVIEW = "Subscriber-only content.";

async function main() {
  const articles = await prisma.article.findMany({
    include: {
      sections: { orderBy: { sectionIndex: "asc" } },
    },
  });

  let added = 0;
  for (const article of articles) {
    const indices = new Set(article.sections.map((s) => s.sectionIndex));
    const missing = [];
    if (!indices.has(8)) missing.push(8);
    if (!indices.has(9)) missing.push(9);
    if (missing.length === 0) continue;

    for (const sectionIndex of missing) {
      const title = sectionIndex === 8 ? SECTION_8_TITLE : SECTION_9_TITLE;
      await prisma.articleSection.create({
        data: {
          articleId: article.id,
          sectionIndex,
          title,
          body: PLACEHOLDER_BODY,
          isGated: true,
          preview: PLACEHOLDER_PREVIEW,
        },
      });
      console.log(`Article ${article.id} (${article.slug}): added section ${sectionIndex} (${title})`);
      added++;
    }
  }

  console.log(`Done. Added ${added} section(s) across ${articles.length} articles checked.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

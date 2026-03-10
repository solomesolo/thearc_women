import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function process_unprocessed_articles() {
  const articles = await prisma.rawMedicalArticle.findMany({
    where: { processed: false },
    orderBy: { scrapedAt: "asc" },
    take: 10,
  });

  return articles;
}

async function main() {
  const batch = await process_unprocessed_articles();
  console.log(
    `Loaded ${batch.length} unprocessed raw_medical_articles for processing.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.taxonomyTag.findMany({
    orderBy: [{ type: "asc" }, { label: "asc" }],
  });
  const byType: Record<string, { id: number; slug: string; label: string }[]> = {};
  for (const t of tags) {
    if (!byType[t.type]) byType[t.type] = [];
    byType[t.type].push({ id: t.id, slug: t.slug, label: t.label });
  }
  return Response.json(byType);
}

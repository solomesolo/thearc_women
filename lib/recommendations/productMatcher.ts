import { prisma } from "@/lib/db";

export async function matchProductsForBundle(bundleKey: string, limit = 3) {
  const bundle = await prisma.canonicalTestBundle.findUnique({
    where: { bundleKey },
    select: { id: true },
  });
  if (!bundle) return [];

  const mappings = await prisma.bundleProductMapping.findMany({
    where: { bundleId: bundle.id },
    orderBy: [{ matchScore: "desc" }, { isPrimary: "desc" }],
    take: limit,
    select: { productId: true, matchScore: true, product: { select: { name: true, available: true } } },
  });

  return mappings
    .filter((m) => m.product.available !== false)
    .map((m) => ({
      product_id: m.productId,
      name: m.product.name,
      match_score: m.matchScore,
    }));
}


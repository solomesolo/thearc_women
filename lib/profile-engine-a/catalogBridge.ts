import { prisma } from "@/lib/db";
import { normalizeBiomarkerName } from "@/lib/profile-engine-a/seed";
import { Prisma } from "@prisma/client";

export type CatalogDatasetProduct = {
  external_product_id?: string;
  provider_id?: string;
  name: string;
  description?: string;
  price_cents?: number;
  currency?: string;
  available?: boolean;
  tags?: Record<string, unknown>;
  biomarkers?: Array<{ name: string; external_code?: string; category?: string }>;
};

export type CatalogDataset = {
  products: CatalogDatasetProduct[];
};

export async function importCatalogDataset(dataset: CatalogDataset) {
  const products = Array.isArray(dataset.products) ? dataset.products : [];
  for (const p of products) {
    const externalProductId = p.external_product_id?.trim() || null;
    const product =
      externalProductId != null
        ? await prisma.catalogProduct.upsert({
            where: { externalProductId },
            create: {
              externalProductId,
              providerId: p.provider_id ?? null,
              name: p.name,
              description: p.description ?? null,
              priceCents: typeof p.price_cents === "number" ? p.price_cents : null,
              currency: p.currency ?? "EUR",
              available: p.available ?? true,
              tags: (p.tags ?? {}) as Prisma.InputJsonValue,
            },
            update: {
              providerId: p.provider_id ?? null,
              name: p.name,
              description: p.description ?? null,
              priceCents: typeof p.price_cents === "number" ? p.price_cents : null,
              currency: p.currency ?? "EUR",
              available: p.available ?? true,
              tags: (p.tags ?? {}) as Prisma.InputJsonValue,
            },
          })
        : await prisma.catalogProduct.create({
            data: {
              externalProductId: null,
              providerId: p.provider_id ?? null,
              name: p.name,
              description: p.description ?? null,
              priceCents: typeof p.price_cents === "number" ? p.price_cents : null,
              currency: p.currency ?? "EUR",
              available: p.available ?? true,
              tags: (p.tags ?? {}) as Prisma.InputJsonValue,
            },
          });

    // Biomarkers + join table
    for (const b of p.biomarkers ?? []) {
      if (!b?.name) continue;
      const normalized = normalizeBiomarkerName(b.name);
      const existing = await prisma.catalogBiomarker.findFirst({
        where: { normalizedName: normalized, externalCode: b.external_code ?? null },
        select: { id: true },
      });
      const biomarker = existing
        ? await prisma.catalogBiomarker.update({
            where: { id: existing.id },
            data: { name: b.name, category: b.category ?? null },
          })
        : await prisma.catalogBiomarker.create({
            data: {
              name: b.name,
              normalizedName: normalized,
              externalCode: b.external_code ?? null,
              category: b.category ?? null,
            },
          });
      await prisma.catalogProductBiomarker.upsert({
        where: { productId_biomarkerId: { productId: product.id, biomarkerId: biomarker.id } },
        create: { productId: product.id, biomarkerId: biomarker.id },
        update: {},
      });
    }
  }
}

export async function rebuildBundleProductMappings() {
  // Strategy:
  // - For each canonical bundle, collect alias normalized names
  // - Find matching catalog biomarkers by normalized_name
  // - Score each product by number of matched biomarkers
  // - Persist bundle_product_mapping rows with match_score + reasons

  const bundles = await prisma.canonicalTestBundle.findMany({
    select: { id: true, bundleKey: true, displayNameEn: true },
  });

  // Clear old mappings (rebuild deterministically)
  await prisma.bundleProductMapping.deleteMany({});

  for (const bundle of bundles) {
    const aliases = await prisma.bundleBiomarkerAlias.findMany({
      where: { bundleId: bundle.id },
      select: { biomarkerNameNormalized: true, biomarkerNameDisplay: true },
    });
    const aliasNorms = aliases.map((a) => a.biomarkerNameNormalized).filter(Boolean);

    // Special-case: comprehensive bundle maps by product name tags (handled later by admin), skip if no aliases.
    if (aliasNorms.length === 0) continue;

    const biomarkers = await prisma.catalogBiomarker.findMany({
      where: { normalizedName: { in: aliasNorms } },
      select: { id: true, normalizedName: true, name: true },
    });
    if (biomarkers.length === 0) continue;

    const biomarkerIds = biomarkers.map((b) => b.id);
    const joins = await prisma.catalogProductBiomarker.findMany({
      where: { biomarkerId: { in: biomarkerIds } },
      select: { productId: true, biomarkerId: true },
    });

    const matchedByProduct = new Map<string, string[]>();
    for (const j of joins) {
      if (!matchedByProduct.has(j.productId)) matchedByProduct.set(j.productId, []);
      matchedByProduct.get(j.productId)!.push(j.biomarkerId);
    }

    for (const [productId, matchedIds] of matchedByProduct.entries()) {
      const uniqueMatched = Array.from(new Set(matchedIds));
      const matchedNames = uniqueMatched
        .map((id) => biomarkers.find((b) => b.id === id))
        .filter(Boolean)
        .map((b) => (b as { name: string }).name);

      const matchScore = uniqueMatched.length;
      await prisma.bundleProductMapping.create({
        data: {
          bundleId: bundle.id,
          productId,
          matchScore,
          isPrimary: false,
          matchReason: {
            strategy: "alias_biomarker_intersection",
            matched_biomarkers: matchedNames,
            alias_count: aliasNorms.length,
          },
        },
      });
    }
  }
}

export async function mapBundleKeysToTopProducts(bundleKeys: string[], limitPerBundle = 5) {
  const bundles = await prisma.canonicalTestBundle.findMany({
    where: { bundleKey: { in: bundleKeys } },
    select: { id: true, bundleKey: true, displayNameEn: true },
  });

  const out: Record<string, Array<{ product_id: string; name: string; match_score: number }>> = {};
  for (const b of bundles) {
    const mappings = await prisma.bundleProductMapping.findMany({
      where: { bundleId: b.id },
      orderBy: [{ matchScore: "desc" }],
      take: limitPerBundle,
      select: { productId: true, matchScore: true, product: { select: { name: true } } },
    });
    out[b.bundleKey] = mappings.map((m) => ({
      product_id: m.productId,
      name: m.product.name,
      match_score: m.matchScore,
    }));
  }
  return out;
}


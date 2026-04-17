import { prisma } from "@/lib/db";
import type { PlanSummary, PlanDetail, PlanItemRow, ActionLogRow } from "@/lib/knowledge/types";

// ─── Plans ────────────────────────────────────────────────────────────────────

function toPlanItemRow(item: {
  id: number;
  title: string;
  description: string | null;
  timing: string;
  sortOrder: number;
  isDone: boolean;
  articleId: number | null;
  article?: { slug: string; title: string } | null;
}): PlanItemRow {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    timing: item.timing,
    sortOrder: item.sortOrder,
    isDone: item.isDone,
    articleId: item.articleId,
    articleSlug: item.article?.slug ?? null,
    articleTitle: item.article?.title ?? null,
  };
}

function toPlanSummary(
  p: { id: number; name: string; status: string; sourceType: string | null; createdAt: Date },
  items: { isDone: boolean }[]
): PlanSummary {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    sourceType: p.sourceType,
    itemCount: items.length,
    doneCount: items.filter((i) => i.isDone).length,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function getPlans(email: string): Promise<PlanSummary[]> {
  const plans = await prisma.healthPlan.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { isDone: true } } },
  });

  return plans.map((p) => toPlanSummary(p, p.items));
}

export async function getPlan(
  email: string,
  planId: number
): Promise<PlanDetail | null> {
  const plan = await prisma.healthPlan.findFirst({
    where: { id: planId, email },
    include: {
      items: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { article: { select: { slug: true, title: true } } },
      },
    },
  });

  if (!plan) return null;

  return {
    ...toPlanSummary(plan, plan.items),
    items: plan.items.map(toPlanItemRow),
  };
}

export async function createPlan(
  email: string,
  data: { name: string; sourceType?: string }
): Promise<PlanSummary> {
  const plan = await prisma.healthPlan.create({
    data: { email, name: data.name, sourceType: data.sourceType },
  });
  return toPlanSummary(plan, []);
}

export async function updatePlan(
  email: string,
  planId: number,
  data: { status?: string; name?: string }
): Promise<void> {
  await prisma.healthPlan.updateMany({
    where: { id: planId, email },
    data,
  });
}

export async function deletePlan(email: string, planId: number): Promise<void> {
  await prisma.healthPlan.deleteMany({ where: { id: planId, email } });
}

// ─── Plan Items ───────────────────────────────────────────────────────────────

export async function createPlanItem(
  email: string,
  planId: number,
  data: {
    title: string;
    description?: string;
    timing?: string;
    sortOrder?: number;
    articleId?: number | null;
  }
): Promise<PlanItemRow> {
  // Verify plan ownership
  const plan = await prisma.healthPlan.findFirst({
    where: { id: planId, email },
    select: { id: true },
  });
  if (!plan) throw new Error("Plan not found");

  const item = await prisma.planItem.create({
    data: {
      planId,
      title: data.title,
      description: data.description,
      timing: data.timing ?? "anytime",
      sortOrder: data.sortOrder ?? 0,
      articleId: data.articleId ?? null,
    },
    include: { article: { select: { slug: true, title: true } } },
  });

  return toPlanItemRow(item);
}

const BATCH_MAX = 30;

export async function createPlanItemsBatch(
  email: string,
  planId: number,
  data: {
    articleId: number | null;
    items: { title: string; description?: string | null; timing?: string }[];
  }
): Promise<PlanItemRow[]> {
  const plan = await prisma.healthPlan.findFirst({
    where: { id: planId, email },
    select: { id: true },
  });
  if (!plan) throw new Error("Plan not found");

  const slice = data.items.slice(0, BATCH_MAX).filter((i) => i.title.trim().length > 0);
  if (slice.length === 0) throw new Error("No items");

  const maxRow = await prisma.planItem.aggregate({
    where: { planId },
    _max: { sortOrder: true },
  });
  let order = (maxRow._max.sortOrder ?? -1) + 1;

  const created: PlanItemRow[] = [];
  for (const item of slice) {
    const row = await prisma.planItem.create({
      data: {
        planId,
        title: item.title.trim().slice(0, 500),
        description: item.description?.trim() ? item.description.trim().slice(0, 16000) : null,
        timing: item.timing ?? "anytime",
        sortOrder: order++,
        articleId: data.articleId,
      },
      include: { article: { select: { slug: true, title: true } } },
    });
    created.push(toPlanItemRow(row));
  }
  return created;
}

export async function updatePlanItem(
  email: string,
  itemId: number,
  data: { isDone?: boolean; title?: string; timing?: string; description?: string }
): Promise<PlanItemRow> {
  // Verify ownership via plan
  const item = await prisma.planItem.findFirst({
    where: { id: itemId, plan: { email } },
    select: { id: true },
  });
  if (!item) throw new Error("Item not found");

  const updated = await prisma.planItem.update({
    where: { id: itemId },
    data,
    include: { article: { select: { slug: true, title: true } } },
  });

  return toPlanItemRow(updated);
}

export async function deletePlanItem(email: string, itemId: number): Promise<void> {
  await prisma.planItem.deleteMany({
    where: { id: itemId, plan: { email } },
  });
}

// ─── Action Logs ──────────────────────────────────────────────────────────────

export async function logAction(
  email: string,
  data: { planId?: number | null; itemId?: number | null; note?: string }
): Promise<ActionLogRow> {
  const row = await prisma.actionLog.create({
    data: {
      email,
      planId: data.planId ?? null,
      itemId: data.itemId ?? null,
      note: data.note,
    },
  });

  return {
    id: row.id,
    planId: row.planId,
    itemId: row.itemId,
    note: row.note,
    loggedAt: row.loggedAt.toISOString(),
  };
}

export async function getRecentLogs(
  email: string,
  limit = 10
): Promise<ActionLogRow[]> {
  const rows = await prisma.actionLog.findMany({
    where: { email },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    planId: r.planId,
    itemId: r.itemId,
    note: r.note,
    loggedAt: r.loggedAt.toISOString(),
  }));
}

import { prisma } from "@/lib/db";
import { applyProgressEvent } from "./progressStateMachine";
import { computeProgressDashboardCounts } from "./progressCounters";
import type {
  ProgressEventInput,
  ProgressEventNormalized,
  ProgressSelection,
  ProgressStateRow,
  RecommendationStatus,
  RouteKey,
} from "./progressTypes";

function normalizeEvent(input: ProgressEventInput): ProgressEventNormalized {
  const t = input.event_type;
  const base: Omit<ProgressEventNormalized, "event_type"> = {
    selection: input.selection,
    note: input.note,
    client_event_id: input.client_event_id,
  };

  if (t === "book_at_lab") return { event_type: "select_route", ...base, selection: { ...(input.selection ?? {}), selected_route: "lab" } };
  if (t === "order_home_test")
    return { event_type: "select_route", ...base, selection: { ...(input.selection ?? {}), selected_route: "home_test" } };
  if (t === "select_doctor_route")
    return { event_type: "select_route", ...base, selection: { ...(input.selection ?? {}), selected_route: "doctor" } };
  if (t === "select_private_route")
    return { event_type: "select_route", ...base, selection: { ...(input.selection ?? {}), selected_route: "private" } };

  if (
    t === "mark_not_started" ||
    t === "mark_planned" ||
    t === "mark_completed" ||
    t === "select_route" ||
    t === "select_product" ||
    t === "select_action_option" ||
    t === "clear_selection" ||
    t === "note"
  ) {
    return { event_type: t, ...base };
  }

  return { event_type: "note", ...base, note: `Unsupported event_type: ${String(t)}` };
}

async function ensureActionOptionIdFromKey(option_key: string): Promise<string> {
  const key = option_key.trim().toLowerCase();
  const existing = await prisma.actionOption.findFirst({ where: { optionKey: key }, select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.actionOption.create({
    data: {
      optionKey: key,
      labelEn: key.replaceAll("_", " "),
      labelDe: null,
      metadata: {},
    },
    select: { id: true },
  });
  return created.id;
}

function rowFromDb(progress: {
  progressState: string;
  selectedRoute: string | null;
  selectedProductId: string | null;
  selectedActionOptionId: string | null;
}): ProgressStateRow {
  return {
    progress_state: progress.progressState as any,
    selected_route: (progress.selectedRoute as RouteKey | null) ?? undefined,
    selected_product_id: progress.selectedProductId ?? undefined,
    selected_action_option_id: progress.selectedActionOptionId ?? undefined,
  };
}

function selectionToDb(selection?: ProgressStateRow): {
  selectedRoute?: string | null;
  selectedProductId?: string | null;
  selectedActionOptionId?: string | null;
} {
  if (!selection) return {};
  return {
    selectedRoute: selection.selected_route ?? undefined,
    selectedProductId: selection.selected_product_id ?? undefined,
    selectedActionOptionId: selection.selected_action_option_id ?? undefined,
  };
}

export async function getOrCreateProgressForInstance(params: { userEmail: string; recommendationInstanceId: string }) {
  const instance = await prisma.recommendationInstance.findFirst({
    where: { id: params.recommendationInstanceId, userEmail: params.userEmail },
    select: { id: true, userEmail: true, bundleKey: true },
  });
  if (!instance) throw new Error("Recommendation instance not found");

  const existing = await prisma.recommendationProgress.findFirst({
    where: { recommendationInstanceId: instance.id },
    select: {
      id: true,
      progressState: true,
      selectedRoute: true,
      selectedProductId: true,
      selectedActionOptionId: true,
      updatedAt: true,
    },
  });

  if (existing) return { instance, progress: existing };

  const created = await prisma.recommendationProgress.create({
    data: {
      userEmail: instance.userEmail,
      recommendationInstanceId: instance.id,
      bundleKey: instance.bundleKey,
      progressState: "not_started",
      selectedRoute: null,
      selectedProductId: null,
      selectedActionOptionId: null,
    },
    select: {
      id: true,
      progressState: true,
      selectedRoute: true,
      selectedProductId: true,
      selectedActionOptionId: true,
      updatedAt: true,
    },
  });

  return { instance, progress: created };
}

export async function getCurrentProgressForInstance(params: { userEmail: string; recommendationInstanceId: string }) {
  const { instance, progress } = await getOrCreateProgressForInstance(params);

  const primaryProduct = await prisma.bundleProductMapping.findFirst({
    where: { bundle: { bundleKey: instance.bundleKey }, isPrimary: true, product: { available: true } },
    select: { productId: true, product: { select: { name: true, priceCents: true, currency: true } } },
  });

  const actionOptions = await prisma.actionOption.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 50,
    select: { id: true, optionKey: true, labelEn: true, labelDe: true },
  });

  return {
    recommendation_instance_id: instance.id,
    bundle_key: instance.bundleKey,
    progress: {
      progress_state: progress.progressState,
      selected_route: progress.selectedRoute ?? undefined,
      selected_product_id: progress.selectedProductId ?? undefined,
      selected_action_option_id: progress.selectedActionOptionId ?? undefined,
      updated_at: progress.updatedAt.toISOString(),
    },
    suggestions: {
      primary_product: primaryProduct
        ? {
            product_id: primaryProduct.productId,
            name: primaryProduct.product.name,
            price_cents: primaryProduct.product.priceCents ?? undefined,
            currency: primaryProduct.product.currency ?? undefined,
          }
        : undefined,
      action_options: actionOptions.map((o) => ({
        id: o.id,
        option_key: o.optionKey,
        label_en: o.labelEn,
        label_de: o.labelDe ?? undefined,
      })),
    },
  };
}

export async function applyProgressEventForInstance(params: {
  userEmail: string;
  recommendationInstanceId: string;
  input: ProgressEventInput & {
    action_option_key?: string;
  };
}) {
  const normalized = normalizeEvent(params.input);

  const selection: ProgressSelection | undefined = { ...(normalized.selection ?? {}) };

  // Allow UI to send action_option_key instead of id.
  const optionKey = params.input.action_option_key?.trim();
  if (optionKey) {
    selection.selected_action_option_id = await ensureActionOptionIdFromKey(optionKey);
    normalized.selection = selection;
    normalized.event_type = "select_action_option";
  }

  return await prisma.$transaction(async (tx) => {
    const instance = await tx.recommendationInstance.findFirst({
      where: { id: params.recommendationInstanceId, userEmail: params.userEmail },
      select: { id: true, userEmail: true, bundleKey: true },
    });
    if (!instance) throw new Error("Recommendation instance not found");

    const existing = await tx.recommendationProgress.findFirst({
      where: { recommendationInstanceId: instance.id },
      select: {
        id: true,
        progressState: true,
        selectedRoute: true,
        selectedProductId: true,
        selectedActionOptionId: true,
      },
    });

    const base = existing
      ? rowFromDb(existing)
      : ({ progress_state: "not_started" } satisfies ProgressStateRow);

    const next = applyProgressEvent(base, normalized);

    const updated = existing
      ? await tx.recommendationProgress.update({
          where: { id: existing.id },
          data: {
            progressState: next.progress_state,
            ...selectionToDb(next),
          },
          select: {
            id: true,
            progressState: true,
            selectedRoute: true,
            selectedProductId: true,
            selectedActionOptionId: true,
            updatedAt: true,
          },
        })
      : await tx.recommendationProgress.create({
          data: {
            userEmail: instance.userEmail,
            recommendationInstanceId: instance.id,
            bundleKey: instance.bundleKey,
            progressState: next.progress_state,
            selectedRoute: next.selected_route ?? null,
            selectedProductId: next.selected_product_id ?? null,
            selectedActionOptionId: next.selected_action_option_id ?? null,
          },
          select: {
            id: true,
            progressState: true,
            selectedRoute: true,
            selectedProductId: true,
            selectedActionOptionId: true,
            updatedAt: true,
          },
        });

    const eventRow = await tx.recommendationProgressEvent.create({
      data: {
        userEmail: instance.userEmail,
        recommendationInstanceId: instance.id,
        bundleKey: instance.bundleKey,
        eventType: normalized.event_type,
        eventPayload: {
          selection: normalized.selection ?? {},
          note: normalized.note ?? null,
          client_event_id: normalized.client_event_id ?? null,
        } as any,
      },
      select: { id: true, createdAt: true },
    });

    return {
      recommendation_instance_id: instance.id,
      bundle_key: instance.bundleKey,
      progress: {
        progress_state: updated.progressState,
        selected_route: updated.selectedRoute ?? undefined,
        selected_product_id: updated.selectedProductId ?? undefined,
        selected_action_option_id: updated.selectedActionOptionId ?? undefined,
        updated_at: updated.updatedAt.toISOString(),
      },
      event: { id: eventRow.id, created_at: eventRow.createdAt.toISOString() },
    };
  });
}

export async function getProgressHistory(params: { userEmail: string; recommendationInstanceId: string }) {
  const instance = await prisma.recommendationInstance.findFirst({
    where: { id: params.recommendationInstanceId, userEmail: params.userEmail },
    select: { id: true },
  });
  if (!instance) throw new Error("Recommendation instance not found");

  const events = await prisma.recommendationProgressEvent.findMany({
    where: { recommendationInstanceId: instance.id, userEmail: params.userEmail },
    orderBy: [{ createdAt: "asc" }],
    take: 500,
    select: { id: true, eventType: true, eventPayload: true, createdAt: true },
  });

  return {
    recommendation_instance_id: params.recommendationInstanceId,
    events: events.map((e) => ({
      id: e.id,
      event_type: e.eventType,
      event_payload: e.eventPayload,
      created_at: e.createdAt.toISOString(),
    })),
  };
}

export async function getProgressDashboardCounts(params: { userEmail: string }) {
  const instances = await prisma.recommendationInstance.findMany({
    where: { userEmail: params.userEmail, active: true },
    take: 500,
    select: { id: true, bundleKey: true },
  });

  if (instances.length === 0) return { dashboard_counts: { action_needed: 0, planned: 0, completed: 0 } };

  // Both depend only on the instance list — run in parallel.
  const instanceIds = instances.map((i) => i.id);
  const bundleKeys = instances.map((i) => i.bundleKey);
  const [progressRows, snapshots] = await Promise.all([
    prisma.recommendationProgress.findMany({
      where: { recommendationInstanceId: { in: instanceIds } },
      select: { recommendationInstanceId: true, progressState: true },
    }),
    prisma.statusSnapshot.findMany({
      where: { userEmail: params.userEmail, bundleKey: { in: bundleKeys } },
      orderBy: [{ calculatedAt: "desc" }],
      take: 500,
      select: { bundleKey: true, recencyStatus: true, calculatedAt: true },
    }),
  ]);

  const progressByInstance = new Map<string, string>(progressRows.map((p) => [p.recommendationInstanceId, p.progressState]));

  const recencyByBundle = new Map<string, RecommendationStatus>();
  for (const s of snapshots) {
    if (recencyByBundle.has(s.bundleKey)) continue;
    const r = s.recencyStatus as RecommendationStatus;
    if (r === "missing" || r === "outdated" || r === "current") recencyByBundle.set(s.bundleKey, r);
  }

  const rows = instances.map((i) => {
    const recommendation_status = (recencyByBundle.get(i.bundleKey) ?? "missing") satisfies RecommendationStatus;
    const progress_state = (progressByInstance.get(i.id) ?? "not_started") as any;
    return { recommendation_status, progress_state };
  });

  const dashboard_counts = computeProgressDashboardCounts(rows as any);
  return { dashboard_counts };
}


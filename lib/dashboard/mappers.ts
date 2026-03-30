import type {
  DashboardHero,
  DashboardKeyArea,
  DashboardSignal,
} from "@/lib/dashboard/types";

const KEY_AREA_ORDER = [
  "sleep",
  "stress",
  "energy",
  "recovery",
  "hormones",
  "cycle",
  "metabolism",
  "nutrition",
  "cardiovascular",
  "gut",
  "skin_hair",
] as const;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapHero(
  heroBaselineRow: Record<string, unknown> | null,
  heroContentRow: Record<string, unknown> | null
): DashboardHero | null {
  if (!heroBaselineRow && !heroContentRow) return null;

  const code =
    asString(heroBaselineRow?.hero_code) ||
    asString(heroBaselineRow?.baseline_code) ||
    asString(heroContentRow?.code) ||
    "unknown";

  const title = asString(heroContentRow?.title);
  const shortBody = asString(heroContentRow?.short_body);
  if (!title || !shortBody) return null;

  return {
    code,
    title,
    shortBody,
    longBody: asNullableString(heroContentRow?.long_body),
    keyLever: asNullableString(heroContentRow?.key_lever),
    tone: asNullableString(heroContentRow?.tone),
    severity: asNullableString(heroContentRow?.severity),
    evidence: heroBaselineRow?.evidence,
  };
}

export function mapKeyAreas(
  userRows: Array<Record<string, unknown>>,
  stateRows: Array<Record<string, unknown>>
): DashboardKeyArea[] {
  const stateByCode = new Map<string, Record<string, unknown>>();
  for (const s of stateRows) {
    const code = asString(s.code);
    if (code) stateByCode.set(code, s);
  }

  const stateByAreaAndState = new Map<string, Record<string, unknown>>();
  for (const s of stateRows) {
    const k = `${asString(s.area)}:${asString(s.state)}`;
    if (k !== ":") stateByAreaAndState.set(k, s);
  }

  const stateById = new Map<string, Record<string, unknown>>();
  for (const s of stateRows) {
    const id = asString(s.id);
    if (id) stateById.set(id, s);
  }

  const mapped = userRows
    .map((r): DashboardKeyArea | null => {
      const rowCode =
        asString(r.key_area_code) || asString(r.state_code) || asString(r.code);
      const area = asString(r.area);
      const state = asString(r.state);
      const rowStateId = asString(r.key_area_state_id);
      const byCode = rowCode ? stateByCode.get(rowCode) : undefined;
      const byAreaState =
        area && state ? stateByAreaAndState.get(`${area}:${state}`) : undefined;
      const byId = rowStateId ? stateById.get(rowStateId) : undefined;
      const content = byCode ?? byAreaState ?? byId ?? null;
      if (!content) return null;

      const outputArea = asString(content.area) || area || "unknown";
      const outputState = asString(content.state) || state || "unknown";
      const outputCode = asString(content.code) || rowCode || `${outputArea}_${outputState}`;
      const title = asString(content.title);
      const shortBody = asString(content.short_body);
      if (!title || !shortBody) return null;

      return {
        area: outputArea,
        code: outputCode,
        state: outputState,
        title,
        shortBody,
        longBody: asNullableString(content.long_body),
        whyItMatters: asNullableString(content.why_it_matters),
        whatInfluencesThis: asNullableString(content.what_influences_this),
        severity: asNullableString(content.severity),
        score: asNumber(r.score, 0),
        evidence: r.evidence,
      };
    })
    .filter((x): x is DashboardKeyArea => x !== null);

  // max one per area: keep highest score
  const bestByArea = new Map<string, DashboardKeyArea>();
  for (const item of mapped) {
    const existing = bestByArea.get(item.area);
    if (!existing || item.score > existing.score) {
      bestByArea.set(item.area, item);
    }
  }

  return Array.from(bestByArea.values()).sort((a, b) => {
    const ai = KEY_AREA_ORDER.indexOf(a.area as (typeof KEY_AREA_ORDER)[number]);
    const bi = KEY_AREA_ORDER.indexOf(b.area as (typeof KEY_AREA_ORDER)[number]);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    return b.score - a.score;
  });
}

export function mapSignals(
  userRows: Array<Record<string, unknown>>,
  defRows: Array<Record<string, unknown>>
): DashboardSignal[] {
  const defByCode = new Map<string, Record<string, unknown>>();
  for (const d of defRows) {
    const c = asString(d.signal_code) || asString(d.code);
    if (c) defByCode.set(c, d);
  }

  return userRows
    .map((r): DashboardSignal | null => {
      const signalCode = asString(r.signal_code) || asString(r.code);
      if (!signalCode) return null;
      const d = defByCode.get(signalCode) ?? {};
      return {
        signalCode,
        title: asString(d.title) || signalCode,
        domain: asString(d.domain) || "general",
        category: asNullableString(d.category),
        score: asNumber(r.score, 0),
        scoreNormalized:
          typeof r.score_normalized === "number" ? (r.score_normalized as number) : null,
        severity: asNullableString(r.severity),
        interpretation: asNullableString(r.interpretation),
        evidence: r.evidence,
      };
    })
    .filter((x): x is DashboardSignal => x !== null)
    .sort((a, b) => b.score - a.score || a.signalCode.localeCompare(b.signalCode));
}


"use client";

import type { OnlineProvider, Product, LocalLab, IgelDoctor, ProviderSuggestions } from "./types";
import { computeProviderSuggestions } from "./matching";

// ── Module-level data cache ───────────────────────────────────────────────────
// Loaded once per session via dynamic import (webpack separate chunk).
// Subsequent calls hit the module cache synchronously.

interface DataBundle {
  providers: OnlineProvider[];
  products: Product[];
  labs: LocalLab[];
  doctors: IgelDoctor[];
}

let _cache: DataBundle | null = null;
let _loadPromise: Promise<DataBundle> | null = null;

export function loadProviderData(): Promise<DataBundle> {
  if (_cache) return Promise.resolve(_cache);
  if (!_loadPromise) {
    _loadPromise = Promise.all([
      import("./data/online-providers.json").then((m) => m.default as unknown as OnlineProvider[]),
      import("./data/products.json").then((m) => m.default as unknown as Product[]),
      import("./data/local-labs.json").then((m) => m.default as unknown as LocalLab[]),
      import("./data/igel-doctors.json").then((m) => m.default as unknown as IgelDoctor[]),
    ]).then(([providers, products, labs, doctors]) => {
      _cache = { providers, products, labs, doctors };
      return _cache;
    });
  }
  return _loadPromise;
}

/** Pre-warm: call this early (e.g. on page mount) so data is ready before cards open. */
export function prefetchProviderData() {
  loadProviderData().catch(() => { /* ignore prefetch errors */ });
}

// ── Batch suggestions ─────────────────────────────────────────────────────────

export interface CheckInput {
  checkKey: string;
  isScreening: boolean;
  biomarkers: string[];
}

export async function computeAllSuggestions(
  checks: CheckInput[],
  zip: string | null,
): Promise<Map<string, ProviderSuggestions>> {
  const data = await loadProviderData();
  const result = new Map<string, ProviderSuggestions>();
  for (const c of checks) {
    result.set(
      c.checkKey,
      computeProviderSuggestions(
        c.checkKey,
        c.isScreening,
        c.biomarkers,
        zip,
        data.products,
        data.providers,
        data.labs,
        data.doctors,
      ),
    );
  }
  return result;
}

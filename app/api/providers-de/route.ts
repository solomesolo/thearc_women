import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { computeProviderSuggestions } from "@/lib/providers-de/matching";
import type { OnlineProvider, Product, LocalLab, IgelDoctor } from "@/lib/providers-de/types";

// ── Lazy-loaded data (server memory, loaded once per cold start) ──────────────
let _providers: OnlineProvider[] | null = null;
let _products: Product[] | null = null;
let _labs: LocalLab[] | null = null;
let _doctors: IgelDoctor[] | null = null;

function dataDir() {
  return path.join(process.cwd(), "lib", "providers-de", "data");
}

function loadData() {
  if (!_providers) {
    const dir = dataDir();
    _providers = JSON.parse(fs.readFileSync(path.join(dir, "online-providers.json"), "utf8"));
    _products  = JSON.parse(fs.readFileSync(path.join(dir, "products.json"),         "utf8"));
    _labs      = JSON.parse(fs.readFileSync(path.join(dir, "local-labs.json"),       "utf8"));
    _doctors   = JSON.parse(fs.readFileSync(path.join(dir, "igel-doctors.json"),     "utf8"));
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const checkKey   = searchParams.get("checkKey")   ?? "";
  const zip        = searchParams.get("zip")         ?? null;
  const isScreening = searchParams.get("isScreening") === "true";
  const biomarkersRaw = searchParams.get("biomarkers") ?? "";
  const biomarkers = biomarkersRaw
    ? biomarkersRaw.split(",").map((b) => b.trim()).filter(Boolean)
    : [];

  if (!checkKey) {
    return NextResponse.json({ error: "checkKey required" }, { status: 400 });
  }

  try {
    loadData();
    const result = computeProviderSuggestions(
      checkKey,
      isScreening,
      biomarkers,
      zip,
      _products!,
      _providers!,
      _labs!,
      _doctors!,
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("[providers-de]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

import fs from "fs";
import path from "path";
import { importCatalogDataset, rebuildBundleProductMappings } from "../lib/profile-engine-a/catalogBridge";
import { ensureEngineASeed } from "../lib/profile-engine-a/seed";

function usage() {
  console.log("Usage: npx tsx scripts/import_catalog_dataset.ts <dataset.json>");
}

async function main() {
  const p = process.argv[2];
  if (!p) {
    usage();
    process.exit(1);
  }
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  const raw = fs.readFileSync(abs, "utf8");
  const json = JSON.parse(raw) as unknown;
  if (!json || typeof json !== "object" || !Array.isArray((json as any).products)) {
    throw new Error("Dataset must be JSON with { products: [...] }");
  }

  await ensureEngineASeed();
  await importCatalogDataset(json as any);
  await rebuildBundleProductMappings();

  console.log("Imported catalog + rebuilt bundle mappings.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


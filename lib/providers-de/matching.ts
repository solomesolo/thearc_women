import type {
  OnlineProvider,
  Product,
  LocalLab,
  IgelDoctor,
  ProductSuggestion,
  LocalLabSuggestion,
  IgelDoctorSuggestion,
  ProviderSuggestions,
} from "./types";
import { getCheckServiceProfile } from "./checkServiceMap";
import { postcodePrefix, prefixesForCity } from "./zipRegions";

// ── Biomarker scoring ─────────────────────────────────────────────────────────

function scoreBiomarkerOverlap(
  productBiomarkers: string[],
  checkBiomarkers: string[],
  extraKeywords: string[],
): number {
  if (productBiomarkers.length === 0) return 0;

  const checkTerms = [
    ...checkBiomarkers.map((b) => b.toLowerCase()),
    ...extraKeywords.map((k) => k.toLowerCase()),
  ];

  let score = 0;
  for (const pb of productBiomarkers) {
    const pbLow = pb.toLowerCase();
    for (const term of checkTerms) {
      if (pbLow.includes(term) || term.includes(pbLow)) {
        score++;
        break;
      }
    }
  }
  return score;
}

// ── Product matching ──────────────────────────────────────────────────────────

export function matchProducts(
  products: Product[],
  providers: OnlineProvider[],
  serviceTypes: string[],
  checkBiomarkers: string[],
  extraKeywords: string[],
  maxResults = 3,
): ProductSuggestion[] {
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  const candidates: ProductSuggestion[] = [];

  for (const product of products) {
    const provider = providerMap.get(product.providerId);
    if (!provider) continue;

    // Provider must offer at least one of the required service types
    if (serviceTypes.length > 0) {
      const providerServices = provider.serviceTypes.map((s) =>
        s.toLowerCase().trim(),
      );
      const hasService = serviceTypes.some((st) =>
        providerServices.includes(st.toLowerCase()),
      );
      if (!hasService) continue;
    }

    const score = scoreBiomarkerOverlap(
      product.biomarkers,
      checkBiomarkers,
      extraKeywords,
    );

    // Only include products that match at least one biomarker (or have no
    // biomarkers listed but belong to a matching provider)
    if (score > 0 || product.biomarkers.length === 0) {
      candidates.push({ product, provider, score });
    }
  }

  // Sort by score descending, then by price ascending (better value first)
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = a.product.price ?? Infinity;
    const pb = b.product.price ?? Infinity;
    return pa - pb;
  });

  // Deduplicate: max 1 product per provider in the top results
  const seen = new Set<number>();
  const results: ProductSuggestion[] = [];
  for (const c of candidates) {
    if (seen.has(c.provider.id)) continue;
    seen.add(c.provider.id);
    results.push(c);
    if (results.length >= maxResults) break;
  }

  return results;
}

// ── Local lab matching ────────────────────────────────────────────────────────

export function matchLocalLabs(
  labs: LocalLab[],
  zip: string | null,
  serviceTypes: string[],
  maxResults = 3,
): LocalLabSuggestion[] {
  if (!zip) return [];

  const prefix = postcodePrefix(zip);
  if (!prefix) return [];

  const results: LocalLabSuggestion[] = [];

  for (const lab of labs) {
    // Check service type match
    if (serviceTypes.length > 0) {
      const labServices = lab.serviceTypes.map((s) => s.toLowerCase());
      const hasService = serviceTypes.some((st) =>
        labServices.includes(st.toLowerCase()),
      );
      if (!hasService) continue;
    }

    // Check geographic proximity via city tags
    for (const cityTag of lab.cityTags) {
      const prefixes = prefixesForCity(cityTag);
      if (prefixes.includes(prefix)) {
        results.push({ lab });
        break;
      }
    }

    if (results.length >= maxResults) break;
  }

  return results;
}

// ── IGeL doctor matching ──────────────────────────────────────────────────────

export function matchIgelDoctors(
  doctors: IgelDoctor[],
  zip: string | null,
  checkKey: string,
  isScreening: boolean,
  maxResults = 3,
): IgelDoctorSuggestion[] {
  if (!zip) return [];

  const prefix = postcodePrefix(zip);
  if (!prefix) return [];

  const norm = checkKey.toLowerCase();

  // Keywords to match against doctor service names/categories
  const matchKeywords = deriveIgelKeywords(norm, isScreening);

  const candidates: Array<{ doctor: IgelDoctor; score: number }> = [];

  for (const doctor of doctors) {
    // ZIP proximity: compare first 2 digits
    const docPrefix = doctor.postcode ? doctor.postcode.slice(0, 2) : null;
    if (!docPrefix || docPrefix !== prefix) continue;

    let score = 0;

    // Blood-test checks → prefer blood_test_relevant doctors
    if (!isScreening && doctor.bloodTestRelevant) score += 2;

    // Service name match
    for (const svcName of doctor.serviceNames) {
      const svcLow = svcName.toLowerCase();
      for (const kw of matchKeywords) {
        if (svcLow.includes(kw)) {
          score += 1;
          break;
        }
      }
    }

    // Category match
    for (const cat of doctor.serviceCategories) {
      if (cat.includes("preventive") || cat.includes("diagnostics")) score += 1;
    }

    candidates.push({ doctor, score });
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates
    .slice(0, maxResults)
    .map(({ doctor }) => ({ doctor }));
}

function deriveIgelKeywords(checkKeyNorm: string, isScreening: boolean): string[] {
  const kw: string[] = [];
  if (isScreening) {
    if (checkKeyNorm.includes("skin")) kw.push("hautkrebs", "skin", "dermatologie");
    if (checkKeyNorm.includes("breast") || checkKeyNorm.includes("mammo"))
      kw.push("brust", "mammo", "gynäkolog");
    if (checkKeyNorm.includes("pap") || checkKeyNorm.includes("hpv") || checkKeyNorm.includes("cervical"))
      kw.push("pap", "hpv", "gynäkolog", "frauenarzt");
    if (checkKeyNorm.includes("colon") || checkKeyNorm.includes("colonoscopy"))
      kw.push("darm", "kolon", "gastroenterol");
    if (checkKeyNorm.includes("bone")) kw.push("knochendichte", "osteoporose", "dxa");
    if (checkKeyNorm.includes("dental")) kw.push("zahn");
    if (kw.length === 0) kw.push("vorsorge", "check", "prävention");
  } else {
    kw.push("checkup", "check-up", "blut", "labor", "vorsorge", "präventiv");
    if (checkKeyNorm.includes("thyroid")) kw.push("schilddrüse", "thyroid");
    if (checkKeyNorm.includes("hormon")) kw.push("hormon");
    if (checkKeyNorm.includes("iron") || checkKeyNorm.includes("ferritin"))
      kw.push("eisen", "ferritin", "blutbild");
  }
  return kw;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeProviderSuggestions(
  checkKey: string,
  isScreening: boolean,
  checkBiomarkers: string[],
  zip: string | null,
  products: Product[],
  providers: OnlineProvider[],
  labs: LocalLab[],
  doctors: IgelDoctor[],
): ProviderSuggestions {
  const profile = getCheckServiceProfile(checkKey, isScreening);

  const onlineProducts = profile.suggestOnlineProducts
    ? matchProducts(
        products,
        providers,
        profile.serviceTypes,
        checkBiomarkers,
        profile.extraBiomarkerKeywords,
      )
    : [];

  const localLabs = profile.suggestLocalLabs
    ? matchLocalLabs(labs, zip, profile.serviceTypes.length > 0 ? profile.serviceTypes : ["blood_tests"])
    : [];

  const igelDoctors = profile.suggestIgelDoctors
    ? matchIgelDoctors(doctors, zip, checkKey, isScreening)
    : [];

  return {
    onlineProducts,
    localLabs,
    igelDoctors,
    hasLocalResults: localLabs.length > 0 || igelDoctors.length > 0,
    zip,
  };
}

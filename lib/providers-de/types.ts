// ── Shared types for the Germany provider suggestion system ───────────────────

export interface OnlineProvider {
  id: number;
  name: string;
  url: string;
  logo: string;
  serviceTypes: string[];
  collectionMethod: string[];
}

export interface Product {
  id: number;
  providerId: number;
  name: string;
  price: number | null;
  biomarkers: string[];
  types: string[];
  audiences: string[];
}

export interface LocalLab {
  id: number;
  name: string;
  location: string;
  cityTags: string[];      // e.g. ["munich", "berlin"]
  url: string;
  logo: string;
  serviceTypes: string[];
  noReferral: boolean;
}

export interface IgelDoctor {
  id: number;
  name: string;
  city: string;
  postcode: string;
  address: string;
  url: string;
  specialty: string;
  bloodTestRelevant: boolean;
  serviceCategories: string[];  // e.g. ["preventive diagnostics"]
  serviceNames: string[];
  lat: number | null;
  lng: number | null;
}

// ── Suggestion result types ───────────────────────────────────────────────────

export interface ProductSuggestion {
  product: Product;
  provider: OnlineProvider;
  score: number;
}

export interface LocalLabSuggestion {
  lab: LocalLab;
}

export interface IgelDoctorSuggestion {
  doctor: IgelDoctor;
}

export interface ProviderSuggestions {
  onlineProducts: ProductSuggestion[];
  localLabs: LocalLabSuggestion[];
  igelDoctors: IgelDoctorSuggestion[];
  /** true = user's ZIP is in Germany and we matched something local */
  hasLocalResults: boolean;
  /** the ZIP code used for matching */
  zip: string | null;
}

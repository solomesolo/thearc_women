// Maps German city tag names (lowercase, used in lab/provider data) to the
// 2-digit postcode prefixes that cover that metro area.
// Used to match a user's ZIP code to nearby providers.

export const CITY_TAG_TO_POSTCODE_PREFIXES: Record<string, string[]> = {
  berlin:        ["10", "12", "13", "14"],
  hamburg:       ["20", "21", "22"],
  munich:        ["80", "81", "85"],
  frankfurt:     ["60", "61", "63", "65"],
  koeln:         ["50", "51"],
  cologne:       ["50", "51"],
  duesseldorf:   ["40", "41"],
  duisburg:      ["47"],
  essen:         ["45"],
  dortmund:      ["44"],
  bochum:        ["44"],
  wuppertal:     ["42"],
  bonn:          ["53"],
  bielefeld:     ["33"],
  hannover:      ["30"],
  hanover:       ["30"],
  goettingen:    ["37"],
  karlsruhe:     ["76"],
  ettlingen:     ["76"],
  stuttgart:     ["70", "71"],
  nuernberg:     ["90"],
  nürnberg:      ["90"],
  nuremberg:     ["90"],
  dresden:       ["01"],
  dresden_area:  ["01", "02", "03"],
  leipzig:       ["04", "06"],
  halle:         ["06"],
  konstanz:      ["78"],
  bremen:        ["28"],
  muenster:      ["48"],
  münster:       ["48"],
};

/**
 * Returns postcode prefixes (2-digit strings) for a city tag name.
 * Normalises the input: lowercase, no umlauts.
 */
export function prefixesForCity(cityTag: string): string[] {
  const norm = cityTag
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .trim();
  return CITY_TAG_TO_POSTCODE_PREFIXES[norm] ?? [];
}

/**
 * Given a German postcode, return the 2-digit prefix.
 * Returns null if the string is not a 5-digit German postcode.
 */
export function postcodePrefix(zip: string): string | null {
  const clean = zip.replace(/\s/g, "");
  if (!/^\d{5}$/.test(clean)) return null;
  return clean.slice(0, 2);
}

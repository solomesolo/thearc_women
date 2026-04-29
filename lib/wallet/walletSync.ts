import type { WalletSyncEntry } from "@/app/api/health-wallet/sync/route";

function walletKey(biomarkerKey: string) {
  return `arc_bm_wallet_${biomarkerKey}`;
}

/** Append synced entries to each biomarker's localStorage history array */
export function saveWalletHistoryFromSync(entries: WalletSyncEntry[]) {
  const byKey: Record<string, WalletSyncEntry[]> = {};
  for (const e of entries) {
    if (!byKey[e.biomarkerKey]) byKey[e.biomarkerKey] = [];
    byKey[e.biomarkerKey].push(e);
  }
  for (const [key, list] of Object.entries(byKey)) {
    try {
      const raw = localStorage.getItem(walletKey(key));
      const existing = raw ? (JSON.parse(raw) as object[]) : [];
      const existing_arr = Array.isArray(existing) ? existing : [existing];
      const merged = [...existing_arr, ...list];
      localStorage.setItem(walletKey(key), JSON.stringify(merged));
    } catch { /* ignore */ }
  }
}

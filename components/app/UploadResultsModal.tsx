"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WalletSyncEntry } from "@/app/api/health-wallet/sync/route";
import { PostUploadSuccess } from "@/components/app/PostUploadSuccess";
import { useRouter } from "next/navigation";
import {
  getUploadHealthDocumentTexts,
  type UploadDocumentKind,
  type UploadHealthDocumentLocale,
} from "@/content/uploadHealthDocumentModal";
import { appendScreeningDocumentUpload } from "@/lib/health-wallet/screeningDocumentUploads";
import { addBackgroundTask } from "@/lib/health-wallet/backgroundProcessing";

type BiomarkerResultStatus = "in_range" | "borderline" | "out_of_range" | "unknown";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "choose_kind" | "upload" | "processing" | "review" | "done";

type SyncMode = "lab" | "screening";

interface ScreeningReviewState {
  documentId: string;
  screeningName: string;
  date: string;
  findings: string;
  fileName: string | null;
  fileType: string | null;
  suggestManualPaste?: boolean;
}

interface PipelineStatus {
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  completedSteps: string[];
  currentStep: string | null;
  fileName: string;
}

const PIPELINE_STEP_KEYS = [
  "ocr",
  "classify",
  "extract",
  "bin_map",
  "normalize",
  "longitudinal",
  "interventions",
] as const;

// ── Wallet persistence helper ─────────────────────────────────────────────────
// Defined in lib/wallet/walletSync.ts — inline fallback so this file is self-contained
// if that module isn't created yet.

function walletKey(biomarkerKey: string) {
  return `arc_bm_wallet_${biomarkerKey}`;
}

function persistWalletEntries(entries: WalletSyncEntry[]) {
  // Group by biomarkerKey and append each entry to its history array
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

// ── ReviewStep ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: BiomarkerResultStatus; label: string }[] = [
  { value: "in_range",     label: "In range" },
  { value: "borderline",   label: "Borderline" },
  { value: "out_of_range", label: "Out of range" },
  { value: "unknown",      label: "Not sure" },
];

const STATUS_COLOR: Record<BiomarkerResultStatus, string> = {
  in_range:     "text-[#16a34a]",
  borderline:   "text-[#d97706]",
  out_of_range: "text-[#dc2626]",
  unknown:      "text-[#737373]",
};

function ReviewStep({
  entries,
  onChange,
  syncError,
  copy,
}: {
  entries: WalletSyncEntry[];
  onChange: (next: WalletSyncEntry[]) => void;
  syncError: string | null;
  copy: {
    hint: string;
    noValuesTitle: string;
    noValuesBody: string;
  };
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Draft state for the row being edited
  const [draftName, setDraftName]   = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDate,  setDraftDate]  = useState("");
  const [draftStatus, setDraftStatus] = useState<BiomarkerResultStatus>("unknown");

  // New-entry form state
  const [newName,   setNewName]   = useState("");
  const [newValue,  setNewValue]  = useState("");
  const [newDate,   setNewDate]   = useState("");
  const [newStatus, setNewStatus] = useState<BiomarkerResultStatus>("unknown");

  function startEdit(i: number) {
    const e = entries[i];
    setDraftName(e.biomarkerName);
    setDraftValue(e.value);
    setDraftDate(e.date);
    setDraftStatus(e.status);
    setEditingIndex(i);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const updated = entries.map((e, i) =>
      i === editingIndex
        ? {
            ...e,
            biomarkerName: draftName.trim() || e.biomarkerName,
            biomarkerKey: (draftName.trim() || e.biomarkerName).toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            value: draftValue,
            date: draftDate,
            status: draftStatus,
            numericValue: parseFloat(draftValue) || e.numericValue,
          }
        : e,
    );
    onChange(updated);
    setEditingIndex(null);
  }

  function removeEntry(i: number) {
    onChange(entries.filter((_, idx) => idx !== i));
    if (editingIndex === i) setEditingIndex(null);
  }

  function addEntry() {
    if (!newName.trim() || !newValue.trim()) return;
    const entry: WalletSyncEntry = {
      biomarkerKey: newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      biomarkerName: newName.trim(),
      date: newDate,
      value: newValue.trim(),
      numericValue: parseFloat(newValue) || null,
      notes: "",
      fileName: null,
      fileType: null,
      status: newStatus,
      panelKey: null,
      isAdditional: true,
      monthsSinceTest: null,
      isOverdue: false,
      overdueByMonths: 0,
      savedAt: new Date().toISOString(),
    };
    onChange([...entries, entry]);
    setNewName(""); setNewValue(""); setNewDate(""); setNewStatus("unknown");
    setShowAddForm(false);
  }

  const isEditing = editingIndex !== null;

  return (
    <div className="space-y-3">
      <p className="text-[0.8125rem] text-[#737373]">
        {copy.hint}
      </p>

      {entries.length === 0 && !showAddForm && (
        <div className="rounded-[14px] bg-[#f7f7f6] px-4 py-6 text-center">
          <p className="text-[0.9375rem] font-semibold text-[#404040]">{copy.noValuesTitle}</p>
          <p className="text-[0.8125rem] text-[#737373] mt-1">
            {copy.noValuesBody}
          </p>
        </div>
      )}

      {/* Extracted / edited entries */}
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div
            key={i}
            className={`rounded-[14px] border transition-colors ${
              editingIndex === i
                ? "border-black/[0.2] bg-white"
                : "border-black/[0.07] bg-[#fafaf9]"
            }`}
          >
            {editingIndex === i ? (
              /* ── Inline edit form ── */
              <div className="px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1">
                      Biomarker name
                    </label>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(ev) => setDraftName(ev.target.value)}
                      className="w-full rounded-[10px] border border-black/[0.12] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={draftValue}
                      onChange={(ev) => setDraftValue(ev.target.value)}
                      placeholder="e.g. 5.2 mmol/L"
                      className="w-full rounded-[10px] border border-black/[0.12] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1">
                      Test date (optional)
                    </label>
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(ev) => setDraftDate(ev.target.value)}
                      className="w-full rounded-[10px] border border-black/[0.12] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1">
                      Status
                    </label>
                    <select
                      value={draftStatus}
                      onChange={(ev) => setDraftStatus(ev.target.value as BiomarkerResultStatus)}
                      className="w-full rounded-[10px] border border-black/[0.12] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={commitEdit}
                    className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.8125rem] font-medium text-white hover:brightness-[0.88]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="ml-auto rounded-[10px] border border-red-200 px-3 py-2 text-[0.8125rem] font-medium text-[#dc2626] hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read row ── */
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.875rem] font-semibold text-[#0c0c0c] truncate">{e.biomarkerName}</p>
                  {e.date && <p className="text-[0.775rem] text-[#737373]">{e.date}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[0.875rem] font-semibold tabular-nums ${STATUS_COLOR[e.status]}`}>
                    {e.value || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => !isEditing && startEdit(i)}
                    disabled={isEditing}
                    aria-label="Edit"
                    className="rounded-full p-1.5 text-[#737373] transition-colors hover:bg-[#f0f0ef] hover:text-[#0c0c0c] disabled:opacity-30"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => !isEditing && removeEntry(i)}
                    disabled={isEditing}
                    aria-label="Remove"
                    className="rounded-full p-1.5 text-[#737373] transition-colors hover:bg-red-50 hover:text-[#dc2626] disabled:opacity-30"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add manually form */}
      {showAddForm ? (
        <div className="rounded-[14px] border border-black/[0.12] bg-white px-4 py-3 space-y-3">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#737373]">
            Add biomarker manually
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Hemoglobin"
                className="w-full rounded-[10px] border border-black/[0.12] bg-[#fafaf9] px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1">Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 13.5 g/dL"
                className="w-full rounded-[10px] border border-black/[0.12] bg-[#fafaf9] px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40 focus:bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1">Date (optional)</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-[10px] border border-black/[0.12] bg-[#fafaf9] px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BiomarkerResultStatus)}
                className="w-full rounded-[10px] border border-black/[0.12] bg-[#fafaf9] px-3 py-2 text-[0.875rem] text-[#0c0c0c] outline-none focus:border-black/40 focus:bg-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addEntry}
              disabled={!newName.trim() || !newValue.trim()}
              className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.8125rem] font-medium text-white hover:brightness-[0.88] disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewName(""); setNewValue(""); setNewDate(""); setNewStatus("unknown"); }}
              className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isEditing && setShowAddForm(true)}
          disabled={isEditing}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-black/[0.15] py-3 text-[0.8125rem] font-medium text-[#737373] transition-colors hover:border-black/30 hover:text-[#0c0c0c] disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add biomarker manually
        </button>
      )}

      {syncError && (
        <p className="text-[0.8125rem] text-[#dc2626] text-center">{syncError}</p>
      )}
    </div>
  );
}

// ── Check key → display name (for "still missing" chips) ─────────────────────

const ALL_CHECK_KEYS: Record<string, string> = {
  preventive_baseline:     "Blood panel",
  thyroid_panel:           "Thyroid panel",
  iron_panel:              "Iron panel",
  hormone_panel:           "Hormone panel",
  cardiovascular_panel:    "Heart health",
  metabolic_health_panel:  "Metabolic panel",
  std_sti_screen:          "STI screen",
  cervical_screening:      "Cervical screening",
  breast_health_check:     "Breast check",
  colorectal_cancer_screen:"Bowel screen",
  bone_density_scan:       "Bone density",
  mental_health_assessment:"Mental health",
  sleep_assessment:        "Sleep assessment",
  dermatology_screening:   "Skin check",
  dental_health_check:     "Dental check",
  eye_health_check:        "Eye check",
  hearing_test:            "Hearing test",
};

// Total expected wallet entries target for progress ring denominator
const WALLET_TARGET = 40;

// ── UploadResultsModal ────────────────────────────────────────────────────────

export function UploadResultsModal({
  open,
  onClose,
  onSynced,
  locale = "en",
}: {
  open: boolean;
  onClose: () => void;
  /** Called after wallet is updated — parent can trigger re-renders / nav cache busts */
  onSynced?: (checkKeys: string[]) => void;
  /** UI copy for document-type choice and upload instructions */
  locale?: UploadHealthDocumentLocale;
}) {
  const router = useRouter();
  const t = getUploadHealthDocumentTexts(locale);
  const [step, setStep] = useState<Step>("choose_kind");
  const [documentKind, setDocumentKind] = useState<UploadDocumentKind | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [walletEntries, setWalletEntries] = useState<WalletSyncEntry[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>("lab");
  const [screeningReview, setScreeningReview] = useState<ScreeningReviewState | null>(null);
  const [syncedCheckKeys, setSyncedCheckKeys] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingStartRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const POLLING_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes max wait

  // Reset when modal opens; snapshot existing wallet size
  useEffect(() => {
    if (open) {
      // Count existing localStorage wallet entries for progress ring baseline
      let count = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith("arc_bm_wallet_")) {
            const arr = JSON.parse(localStorage.getItem(k) ?? "[]");
            if (Array.isArray(arr)) count += arr.length;
          }
        }
      } catch { /* ignore */ }
      setSnapshotCount(count);

      setStep("choose_kind");
      setDocumentKind(null);
      setConsentGiven(false);
      setDragOver(false);
      setUploading(false);
      setUploadError(null);
      setDocumentId(null);
      setFileName("");
      setPipelineStatus(null);
      setWalletEntries([]);
      setSyncMode("lab");
      setScreeningReview(null);
      setSyncedCheckKeys([]);
      setSyncing(false);
      setSyncError(null);
    }
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [open]);

  // ── Consent cookie helper ──────────────────────────────────────────────────
  function setConsentCookie() {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `arc_upload_consent=1; path=/; expires=${expires}; SameSite=Strict`;
  }

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const texts = getUploadHealthDocumentTexts(locale);
    if (!consentGiven) {
      const err =
        documentKind === "screening"
          ? texts.upload.screening.consentError
          : texts.upload.lab.consentError;
      setUploadError(err);
      return;
    }
    setConsentCookie();
    setUploading(true);
    setUploadError(null);
    setFileName(file.name);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("uploadKind", documentKind === "screening" ? "screening" : "lab");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }
      const docId: string = data.uploaded?.[0]?.documentId;
      if (!docId) throw new Error("No document ID returned.");
      setDocumentId(docId);
      setStep("processing");
      startPolling(docId, documentKind ?? "lab", file.name);
      // Trigger the Claude-based processing pipeline (works on Vercel + local)
      fetch(`/api/upload/${encodeURIComponent(docId)}/process`, { method: "POST" })
        .catch(() => {}); // fire-and-forget; polling handles completion/failure
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [consentGiven, documentKind, locale]);

  // ── Pipeline polling ───────────────────────────────────────────────────────
  function startPolling(docId: string, uploadKind: UploadDocumentKind, sourceFileName: string) {
    pollingStartRef.current = Date.now();
    const poll = async () => {
      try {
        const res = await fetch(`/api/health-data/upload/${docId}/status`);
        if (!res.ok) throw new Error("Status check failed.");
        const data = await res.json();

        const isComplete: boolean = data.isComplete ?? false;
        const hasError: boolean = data.hasError ?? false;
        const completedSteps: string[] = data.completedSteps ?? [];
        const currentStep: string | null = data.currentStep ?? null;
        const errorMessage: string | null = data.errorMessage ?? null;
        const timedOut = Date.now() - pollingStartRef.current > POLLING_TIMEOUT_MS;

        setPipelineStatus({
          isComplete: isComplete || timedOut,
          hasError: hasError || timedOut,
          errorMessage: timedOut ? "Processing timed out — you can still review any extracted results." : errorMessage,
          completedSteps,
          currentStep,
          fileName: data.fileName ?? fileName,
        });

        if (isComplete || hasError || timedOut) {
          await loadWalletEntries(docId, uploadKind, sourceFileName);
        } else {
          pollingRef.current = setTimeout(poll, 2500);
        }
      } catch {
        if (Date.now() - pollingStartRef.current > POLLING_TIMEOUT_MS) {
          await loadWalletEntries(docId, uploadKind, sourceFileName);
        } else {
          pollingRef.current = setTimeout(poll, 4000);
        }
      }
    };
    poll();
  }

  async function loadWalletEntries(
    docId: string,
    uploadKind: UploadDocumentKind,
    sourceFileName: string,
  ) {
    try {
      const res = await fetch("/api/health-wallet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          uploadKind: uploadKind === "screening" ? "screening" : "lab",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Sync failed");
      }
      if (data.mode === "screening" && data.screeningDraft) {
        setSyncMode("screening");
        setScreeningReview({
          documentId: data.screeningDraft.documentId ?? docId,
          screeningName: data.screeningDraft.screeningName ?? "",
          date: data.screeningDraft.date ?? "",
          findings: data.screeningDraft.findings ?? "",
          fileName: data.screeningDraft.fileName ?? sourceFileName,
          fileType: data.screeningDraft.fileType ?? null,
          suggestManualPaste: Boolean(data.screeningDraft.suggestManualPaste),
        });
        setWalletEntries([]);
        setSyncedCheckKeys([]);
      } else {
        setSyncMode("lab");
        setScreeningReview(null);
        setWalletEntries(data.walletEntries ?? []);
        setSyncedCheckKeys(data.checkKeys ?? []);
      }
    } catch {
      if (uploadKind === "screening") {
        setSyncMode("screening");
        setScreeningReview({
          documentId: docId,
          screeningName: "",
          date: "",
          findings: "",
          fileName: sourceFileName,
          fileType: null,
          suggestManualPaste: true,
        });
        setWalletEntries([]);
        setSyncedCheckKeys([]);
      } else {
        setSyncMode("lab");
        setScreeningReview(null);
        setWalletEntries([]);
        setSyncedCheckKeys([]);
      }
    }
    setStep("review");
  }

  // ── Save to wallet — localStorage; lab path also relied on DB sync in loadWalletEntries ──
  function handleSave() {
    setSyncing(true);
    setSyncError(null);
    try {
      if (syncMode === "screening" && screeningReview) {
        appendScreeningDocumentUpload({
          id: crypto.randomUUID(),
          documentId: screeningReview.documentId,
          screeningName: screeningReview.screeningName.trim(),
          date: screeningReview.date.trim(),
          findings: screeningReview.findings.trim(),
          fileName: screeningReview.fileName,
          fileType: screeningReview.fileType,
          savedAt: new Date().toISOString(),
        });
        setStep("done");
        onSynced?.([]);
      } else {
        persistWalletEntries(walletEntries);
        setStep("done");
        onSynced?.(syncedCheckKeys);
      }
    } catch {
      setSyncError(getUploadHealthDocumentTexts(locale).saveWalletError);
    } finally {
      setSyncing(false);
    }
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }


  if (!open) return null;

  const uploadCopy = documentKind ? t.upload[documentKind] : t.upload.lab;

  const reviewMainTitle =
    syncMode === "screening"
      ? t.screeningReview.title
      : walletEntries.length === 0
        ? t.review.noValuesTitle
        : locale === "de"
          ? `${walletEntries.length} Wert${walletEntries.length > 1 ? "e" : ""} erkannt — bitte prüfen und korrigieren`
          : `${walletEntries.length} value${walletEntries.length > 1 ? "s" : ""} extracted — review and correct`;

  const savePrimaryLabel = syncing
    ? t.reviewFooter.saving
    : syncMode === "screening"
      ? t.screeningReview.save
      : walletEntries.length === 0
        ? t.reviewFooter.saveNone
        : walletEntries.length === 1
          ? t.reviewFooter.saveOne
          : locale === "de"
            ? `${walletEntries.length}${t.reviewFooter.saveManySuffix}`
            : `${t.reviewFooter.saveManyPrefix}${walletEntries.length}${t.reviewFooter.saveManySuffix}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/[0.06]">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-[#737373]">
              {step === "choose_kind" && t.chooseKind.eyebrow}
              {step === "upload" && uploadCopy.eyebrow}
              {step === "processing" && t.processing.eyebrow}
              {step === "review" && t.review.eyebrow}
              {step === "done" && t.done.eyebrow}
            </p>
            <h2 className="mt-0.5 text-[1.0625rem] font-semibold text-[#0c0c0c]">
              {step === "choose_kind" && t.chooseKind.title}
              {step === "upload" && uploadCopy.title}
              {step === "processing" &&
                `${t.processing.readingVerb} ${fileName || t.processing.readingPlaceholder}…`}
              {step === "review" && reviewMainTitle}
              {step === "done" && t.done.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#f0f0ef] transition-colors"
            aria-label={locale === "de" ? "Schließen" : "Close"}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="#0c0c0c" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {step === "choose_kind" && (
            <div className="space-y-4">
              <p className="text-[0.8125rem] text-[#737373] leading-relaxed">{t.chooseKind.subtitle}</p>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDocumentKind("lab");
                    setStep("upload");
                    setConsentGiven(false);
                    setUploadError(null);
                  }}
                  className="rounded-[18px] border border-black/[0.1] bg-[#fafaf9] px-4 py-4 text-left transition-colors hover:border-black/[0.22] hover:bg-[#f5f5f3]"
                >
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{t.chooseKind.labTitle}</p>
                  <p className="mt-1 text-[0.8125rem] text-[#525252] leading-snug">{t.chooseKind.labBody}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentKind("screening");
                    setStep("upload");
                    setConsentGiven(false);
                    setUploadError(null);
                  }}
                  className="rounded-[18px] border border-black/[0.1] bg-[#fafaf9] px-4 py-4 text-left transition-colors hover:border-black/[0.22] hover:bg-[#f5f5f3]"
                >
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{t.chooseKind.screeningTitle}</p>
                  <p className="mt-1 text-[0.8125rem] text-[#525252] leading-snug">{t.chooseKind.screeningBody}</p>
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOAD STEP ── */}
          {step === "upload" && (
            <>
              <div className="rounded-[14px] bg-[#f7f7f6] px-4 py-3 text-[0.8125rem] text-[#404040] leading-relaxed">
                <p className="font-semibold text-[#0c0c0c] mb-1">{uploadCopy.policyTitle}</p>
                <ul className="space-y-0.5 list-disc list-inside text-[0.8rem]">
                  {uploadCopy.policyBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.775rem] text-[#737373]">{uploadCopy.policyFootnote}</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <span className="mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 accent-[#0c0c0c]"
                  />
                </span>
                <span className="text-[0.8125rem] text-[#404040] leading-snug">{uploadCopy.consent}</span>
              </label>

              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => consentGiven && fileInputRef.current?.click()}
                className={`rounded-[18px] border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10 cursor-pointer
                  ${dragOver ? "border-[#0c0c0c] bg-[#f0f0ef]" : "border-black/[0.15] bg-[#fafaf9]"}
                  ${!consentGiven ? "opacity-40 pointer-events-none" : "hover:border-black/40 hover:bg-[#f7f7f6]"}`}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-[#737373]">
                  <path d="M18 24V12M18 12l-5 5M18 12l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 26a6 6 0 01-.6-11.94A9 9 0 0124 10.4 7 7 0 0130 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
                <div className="text-center">
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                    {uploading ? t.uploading : uploadCopy.dropTitle}
                  </p>
                  <p className="text-[0.8rem] text-[#737373] mt-0.5">{uploadCopy.dropSubtitle}</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={onFileChange}
                disabled={!consentGiven || uploading}
              />

              {uploadError && (
                <p className="text-[0.8125rem] text-[#dc2626] text-center">{uploadError}</p>
              )}
            </>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === "processing" && (
            <div className="space-y-3">
              {PIPELINE_STEP_KEYS.map((key) => {
                const done = pipelineStatus?.completedSteps.includes(key);
                const active = pipelineStatus?.currentStep === key;
                const label = t.pipeline[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-5 w-5 flex items-center justify-center">
                      {done ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#16a34a"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : active ? (
                        <span className="h-4 w-4 rounded-full border-2 border-[#0c0c0c] border-t-transparent animate-spin" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-black/[0.15]" />
                      )}
                    </span>
                    <span className={`text-[0.875rem] ${done ? "text-[#404040]" : active ? "font-semibold text-[#0c0c0c]" : "text-[#a3a3a3]"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}

              {pipelineStatus?.hasError && (
                <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 mt-4">
                  <p className="text-[0.8125rem] text-[#dc2626] font-semibold">{t.errors.processingIssue}</p>
                  <p className="text-[0.8rem] text-[#dc2626] mt-0.5">
                    {pipelineStatus.errorMessage ?? t.errors.processingFallback}
                  </p>
                </div>
              )}

              {/* Estimated time — shown in both languages so users aren't confused */}
              {!pipelineStatus?.hasError && (
                <div className="flex items-center gap-2 pt-3 border-t border-black/[0.06]">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 text-[#a3a3a3]" aria-hidden>
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[0.775rem] text-[#a3a3a3]">{t.processing.estimatedTime}</span>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEW STEP ── */}
          {step === "review" && syncMode === "screening" && screeningReview && (
            <div className="space-y-4">
              <p className="text-[0.8125rem] text-[#737373] leading-relaxed">{t.screeningReview.hint}</p>
              {screeningReview.suggestManualPaste && (
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.8125rem] leading-snug text-amber-950">
                  {t.screeningReview.ocrUnreadableHint}
                </div>
              )}
              {screeningReview.fileName && (
                <p className="text-[0.75rem] text-[#a3a3a3]">
                  {locale === "de" ? "Datei: " : "File: "}
                  <span className="text-[#525252]">{screeningReview.fileName}</span>
                </p>
              )}
              <div>
                <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1.5">
                  {locale === "de" ? "Name der Untersuchung" : "Screening name"}
                </label>
                <input
                  type="text"
                  value={screeningReview.screeningName}
                  onChange={(e) =>
                    setScreeningReview((prev) =>
                      prev ? { ...prev, screeningName: e.target.value } : prev,
                    )
                  }
                  placeholder={locale === "de" ? "z.B. MRT, Mammographie, Koloskopie…" : "e.g. MRI, Mammography, Colonoscopy…"}
                  className="w-full rounded-[12px] border border-black/[0.12] bg-white px-3 py-2.5 text-[0.875rem] text-[#0c0c0c]"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1.5">
                  {t.screeningReview.dateLabel}
                </label>
                <input
                  type="date"
                  value={screeningReview.date}
                  onChange={(e) =>
                    setScreeningReview((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev,
                    )
                  }
                  className="w-full rounded-[12px] border border-black/[0.12] bg-white px-3 py-2.5 text-[0.875rem] text-[#0c0c0c]"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#737373] mb-1.5">
                  {t.screeningReview.findingsLabel}
                </label>
                <textarea
                  value={screeningReview.findings}
                  onChange={(e) =>
                    setScreeningReview((prev) =>
                      prev ? { ...prev, findings: e.target.value } : prev,
                    )
                  }
                  rows={8}
                  placeholder={t.screeningReview.findingsPlaceholder}
                  className="w-full resize-y rounded-[12px] border border-black/[0.12] bg-white px-3 py-2.5 text-[0.875rem] text-[#0c0c0c] leading-relaxed min-h-[140px]"
                />
              </div>
              {syncError && (
                <p className="text-[0.8125rem] text-[#dc2626]">{syncError}</p>
              )}
            </div>
          )}
          {step === "review" && syncMode === "lab" && (
            <ReviewStep
              entries={walletEntries}
              onChange={setWalletEntries}
              syncError={syncError}
              copy={{
                hint: t.review.hint,
                noValuesTitle: t.review.noValuesTitle,
                noValuesBody: t.review.noValuesBody,
              }}
            />
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && (() => {
            const missingNames = Object.keys(ALL_CHECK_KEYS)
              .filter((k) => !syncedCheckKeys.includes(k))
              .map((k) => ALL_CHECK_KEYS[k]);

            if (syncMode === "screening") {
              return (
                <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-6 text-center space-y-3">
                  <p className="text-[0.9375rem] font-semibold text-[#404040]">{t.screeningReview.doneTitle}</p>
                  <p className="text-[0.8125rem] text-[#737373]">{t.screeningReview.doneBody}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/results/overview");
                    }}
                    className="w-full rounded-full bg-[#0c0c0c] py-3 text-[0.9375rem] font-semibold text-white hover:bg-[#1f1f1f] transition-colors"
                  >
                    {locale === "de" ? "Zur Health Wallet" : "View Health Wallet"}
                  </button>
                </div>
              );
            }

            if (walletEntries.length > 0) {
              return (
                <PostUploadSuccess
                  addedEntries={walletEntries}
                  previousCount={snapshotCount}
                  totalExpected={WALLET_TARGET}
                  nextMissingNames={missingNames}
                  onClose={onClose}
                  onViewWallet={() => { onClose(); router.push("/results/overview"); }}
                  language={locale}
                />
              );
            }

            return (
              <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-6 text-center space-y-1">
                <p className="text-[0.9375rem] font-semibold text-[#404040]">{t.doneEmpty.title}</p>
                <p className="text-[0.8125rem] text-[#737373]">{t.doneEmpty.body}</p>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-black/[0.06] flex gap-3">
          {step === "choose_kind" && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
            >
              {t.chooseKind.cancel}
            </button>
          )}
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("choose_kind");
                  setDocumentKind(null);
                  setConsentGiven(false);
                  setUploadError(null);
                }}
                className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
              >
                {uploadCopy.back}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
              >
                {uploadCopy.cancel}
              </button>
            </>
          )}
          {step === "processing" && (
            <button
              type="button"
              onClick={() => {
                if (documentId && documentKind) {
                  addBackgroundTask({
                    id: crypto.randomUUID(),
                    docId: documentId,
                    uploadKind: documentKind,
                    fileName: fileName,
                    locale: locale,
                    startedAt: new Date().toISOString(),
                  });
                }
                if (pollingRef.current) clearTimeout(pollingRef.current);
                onClose();
              }}
              className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
            >
              {t.processingFooter.background}
            </button>
          )}
          {step === "review" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/[0.12] px-5 py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
              >
                {t.reviewFooter.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={syncing}
                className="flex-1 rounded-full bg-[#0c0c0c] py-3 text-[0.9375rem] font-semibold text-white hover:bg-[#1f1f1f] transition-colors disabled:opacity-40"
              >
                {savePrimaryLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

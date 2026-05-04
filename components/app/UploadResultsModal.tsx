"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WalletSyncEntry } from "@/app/api/health-wallet/sync/route";
import { PostUploadSuccess } from "@/components/app/PostUploadSuccess";
import { useRouter } from "next/navigation";

type BiomarkerResultStatus = "in_range" | "borderline" | "out_of_range" | "unknown";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "processing" | "review" | "done";

interface PipelineStatus {
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  completedSteps: string[];
  currentStep: string | null;
  fileName: string;
}

const PIPELINE_STEPS = [
  { key: "ocr",           label: "Reading document" },
  { key: "classify",      label: "Identifying document type" },
  { key: "extract",       label: "Extracting health data" },
  { key: "bin_map",       label: "Categorising results" },
  { key: "normalize",     label: "Normalising values" },
  { key: "longitudinal",  label: "Saving to your health record" },
  { key: "interventions", label: "Updating care plan" },
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
}: {
  entries: WalletSyncEntry[];
  onChange: (next: WalletSyncEntry[]) => void;
  syncError: string | null;
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
        Check values below — correct any errors before saving, or add missing ones manually.
      </p>

      {entries.length === 0 && !showAddForm && (
        <div className="rounded-[14px] bg-[#f7f7f6] px-4 py-6 text-center">
          <p className="text-[0.9375rem] font-semibold text-[#404040]">No values extracted</p>
          <p className="text-[0.8125rem] text-[#737373] mt-1">
            The document may not contain structured lab values. Add results manually below.
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
}: {
  open: boolean;
  onClose: () => void;
  /** Called after wallet is updated — parent can trigger re-renders / nav cache busts */
  onSynced?: (checkKeys: string[]) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [consentGiven, setConsentGiven] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [walletEntries, setWalletEntries] = useState<WalletSyncEntry[]>([]);
  const [syncedCheckKeys, setSyncedCheckKeys] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setStep("upload");
      setConsentGiven(false);
      setDragOver(false);
      setUploading(false);
      setUploadError(null);
      setDocumentId(null);
      setFileName("");
      setPipelineStatus(null);
      setWalletEntries([]);
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
    if (!consentGiven) {
      setUploadError("Please confirm your consent before uploading.");
      return;
    }
    setConsentCookie();
    setUploading(true);
    setUploadError(null);
    setFileName(file.name);

    const fd = new FormData();
    fd.append("file", file);

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
      startPolling(docId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [consentGiven]);

  // ── Pipeline polling ───────────────────────────────────────────────────────
  function startPolling(docId: string) {
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

        setPipelineStatus({
          isComplete,
          hasError,
          errorMessage,
          completedSteps,
          currentStep,
          fileName: data.fileName ?? fileName,
        });

        if (isComplete || hasError) {
          // Move to review (even if there's an error — may have partial results)
          await loadWalletEntries(docId);
        } else {
          pollingRef.current = setTimeout(poll, 2500);
        }
      } catch {
        pollingRef.current = setTimeout(poll, 4000);
      }
    };
    poll();
  }

  async function loadWalletEntries(docId: string) {
    try {
      // DB records created here (UserCheckStatus + UserCheckResult upserts)
      const res = await fetch("/api/health-wallet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      setWalletEntries(data.walletEntries ?? []);
      setSyncedCheckKeys(data.checkKeys ?? []);
    } catch {
      setWalletEntries([]);
      setSyncedCheckKeys([]);
    }
    setStep("review");
  }

  // ── Save to wallet — localStorage only (DB already written in loadWalletEntries) ──
  function handleSave() {
    setSyncing(true);
    setSyncError(null);
    try {
      persistWalletEntries(walletEntries);
      setStep("done");
      onSynced?.(syncedCheckKeys);
    } catch {
      setSyncError("Failed to save results. Please try again.");
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
              {step === "upload" && "Upload document"}
              {step === "processing" && "Analysing document"}
              {step === "review" && "Review results"}
              {step === "done" && "Results"}
            </p>
            <h2 className="mt-0.5 text-[1.0625rem] font-semibold text-[#0c0c0c]">
              {step === "upload" && "Add your lab results"}
              {step === "processing" && `Reading ${fileName || "your document"}…`}
              {step === "review" && (walletEntries.length === 0 ? "No values extracted" : `${walletEntries.length} value${walletEntries.length > 1 ? "s" : ""} extracted — review and correct`)}
              {step === "done" && "Health Wallet updated"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#f0f0ef] transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="#0c0c0c" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── UPLOAD STEP ── */}
          {step === "upload" && (
            <>
              {/* Policy note */}
              <div className="rounded-[14px] bg-[#f7f7f6] px-4 py-3 text-[0.8125rem] text-[#404040] leading-relaxed">
                <p className="font-semibold text-[#0c0c0c] mb-1">Best results from these documents:</p>
                <ul className="space-y-0.5 list-disc list-inside text-[0.8rem]">
                  <li>Blood test panel (PDF or photo)</li>
                  <li>Lab report (any language)</li>
                  <li>Screening letter or GP letter</li>
                </ul>
                <p className="mt-2 text-[0.775rem] text-[#737373]">
                  Supported formats: PDF, JPG, PNG · Max 20 MB per file
                </p>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <span className="mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 accent-[#0c0c0c]"
                  />
                </span>
                <span className="text-[0.8125rem] text-[#404040] leading-snug">
                  I consent to Arc Woman processing my health document to extract biomarker values and store them securely in my personal health record.
                </span>
              </label>

              {/* Drop zone */}
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
                    {uploading ? "Uploading…" : "Drop file here or tap to choose"}
                  </p>
                  <p className="text-[0.8rem] text-[#737373] mt-0.5">PDF, JPG or PNG</p>
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
              {PIPELINE_STEPS.map((s) => {
                const done = pipelineStatus?.completedSteps.includes(s.key);
                const active = pipelineStatus?.currentStep === s.key;
                return (
                  <div key={s.key} className="flex items-center gap-3">
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
                      {s.label}
                    </span>
                  </div>
                );
              })}

              {pipelineStatus?.hasError && (
                <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 mt-4">
                  <p className="text-[0.8125rem] text-[#dc2626] font-semibold">Processing issue</p>
                  <p className="text-[0.8rem] text-[#dc2626] mt-0.5">
                    {pipelineStatus.errorMessage ?? "We had trouble reading the document. Any values found will still appear below."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEW STEP ── */}
          {step === "review" && (
            <ReviewStep
              entries={walletEntries}
              onChange={setWalletEntries}
              syncError={syncError}
            />
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && (() => {
            const missingNames = Object.keys(ALL_CHECK_KEYS)
              .filter((k) => !syncedCheckKeys.includes(k))
              .map((k) => ALL_CHECK_KEYS[k]);

            if (walletEntries.length > 0) {
              return (
                <PostUploadSuccess
                  addedEntries={walletEntries}
                  previousCount={snapshotCount}
                  totalExpected={WALLET_TARGET}
                  nextMissingNames={missingNames}
                  onClose={onClose}
                  onViewWallet={() => { onClose(); router.push("/results/overview"); }}
                />
              );
            }

            // Fallback: no entries extracted or added
            return (
              <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-6 text-center space-y-1">
                <p className="text-[0.9375rem] font-semibold text-[#404040]">Nothing saved</p>
                <p className="text-[0.8125rem] text-[#737373]">
                  No values were extracted or added. Try uploading a clearer document.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-black/[0.06] flex gap-3">
          {step === "upload" && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
            >
              Cancel
            </button>
          )}
          {step === "processing" && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
            >
              Run in background
            </button>
          )}
          {step === "review" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/[0.12] px-5 py-3 text-[0.9375rem] font-semibold text-[#404040] hover:bg-[#f0f0ef] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={syncing}
                className="flex-1 rounded-full bg-[#0c0c0c] py-3 text-[0.9375rem] font-semibold text-white hover:bg-[#1f1f1f] transition-colors disabled:opacity-40"
              >
                {syncing
                  ? "Saving…"
                  : walletEntries.length === 0
                    ? "Save (no values)"
                    : `Save ${walletEntries.length} value${walletEntries.length > 1 ? "s" : ""}`}
              </button>
            </>
          )}
          {/* Done step CTAs are rendered inside PostUploadSuccess */}
        </div>
      </div>
    </div>
  );
}

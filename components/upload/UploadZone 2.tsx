"use client";

import { useState, useRef, useCallback } from "react";

// ── constants ─────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

// ── types ─────────────────────────────────────────────────────────────────────

type FileStatus =
  | { phase: "queued" }
  | { phase: "uploading"; progress: number }
  | { phase: "success"; documentId: string; ocrJobId: string }
  | { phase: "error"; message: string };

type FileEntry = {
  id: string; // local key
  file: File;
  status: FileStatus;
};

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type))
    return "Unsupported format — PDF, JPG or PNG only.";
  if (file.size > MAX_BYTES)
    return `Too large (${formatBytes(file.size)}) — max 20 MB.`;
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusIcon({ phase }: { phase: FileStatus["phase"] }) {
  if (phase === "success")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] text-emerald-700 font-bold">
        ✓
      </span>
    );
  if (phase === "error")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[11px] text-red-600 font-bold">
        ✕
      </span>
    );
  if (phase === "uploading")
    return (
      <span className="flex h-5 w-5 items-center justify-center">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
      </span>
    );
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/[0.06] text-[10px] text-black/40">
      –
    </span>
  );
}

function FileRow({
  entry,
  onRemove,
}: {
  entry: FileEntry;
  onRemove: (id: string) => void;
}) {
  const { file, status } = entry;
  const isSettled =
    status.phase === "success" || status.phase === "error";

  return (
    <div className="rounded-[14px] border border-black/[0.08] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <StatusIcon phase={status.phase} />

        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
            {file.name}
          </p>
          <p className="text-[11px] text-black/40">
            {formatBytes(file.size)}
            {status.phase === "success" && (
              <span className="ml-2 text-emerald-600">Uploaded · OCR job created</span>
            )}
            {status.phase === "error" && (
              <span className="ml-2 text-red-600">{status.message}</span>
            )}
          </p>
        </div>

        {(status.phase === "queued" || isSettled) && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="shrink-0 rounded-full p-1 text-black/30 hover:bg-black/[0.06] hover:text-black/60 transition-colors"
            aria-label="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {status.phase === "uploading" && (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-[var(--foreground)] transition-all duration-150"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function UploadZone() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── file collection ─────────────────────────────────────────────────────────

  const addFiles = useCallback((rawFiles: FileList | File[]) => {
    const incoming = Array.from(rawFiles);
    const newEntries: FileEntry[] = incoming.map((file) => {
      const validationError = validate(file);
      return {
        id: uid(),
        file,
        status: validationError
          ? { phase: "error", message: validationError }
          : { phase: "queued" },
      };
    });
    setEntries((prev) => [...prev, ...newEntries]);
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // ── upload ──────────────────────────────────────────────────────────────────

  function updateEntry(id: string, status: FileStatus) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }

  async function uploadEntry(entry: FileEntry): Promise<void> {
    updateEntry(entry.id, { phase: "uploading", progress: 0 });

    const formData = new FormData();
    formData.append("file", entry.file);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) {
          updateEntry(entry.id, {
            phase: "uploading",
            progress: Math.round((ev.loaded / ev.total) * 100),
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let documentId = "";
          let ocrJobId = "";
          try {
            const body = JSON.parse(xhr.responseText);
            documentId = body.uploaded?.[0]?.documentId ?? "";
            ocrJobId = body.uploaded?.[0]?.ocrJobId ?? "";
          } catch {}
          updateEntry(entry.id, { phase: "success", documentId, ocrJobId });
        } else {
          let message = "Upload failed. Please try again.";
          try {
            const body = JSON.parse(xhr.responseText);
            if (body?.error) message = body.error;
          } catch {}
          updateEntry(entry.id, { phase: "error", message });
        }
        resolve();
      });

      xhr.addEventListener("error", () => {
        updateEntry(entry.id, {
          phase: "error",
          message: "Network error. Check your connection and try again.",
        });
        resolve();
      });

      xhr.send(formData);
    });
  }

  async function handleUploadAll() {
    const queued = entries.filter((e) => e.status.phase === "queued");
    if (queued.length === 0) return;

    setUploading(true);
    // Upload sequentially to avoid hammering the endpoint
    for (const entry of queued) {
      await uploadEntry(entry);
    }
    setUploading(false);
  }

  // ── derived state ───────────────────────────────────────────────────────────

  const queuedCount = entries.filter((e) => e.status.phase === "queued").length;
  const successCount = entries.filter((e) => e.status.phase === "success").length;
  const hasEntries = entries.length > 0;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop files here or click to select"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!uploading && (e.key === "Enter" || e.key === " "))
            inputRef.current?.click();
        }}
        className={[
          "flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-8 py-10 text-center transition-colors select-none",
          dragging
            ? "border-black/40 bg-black/[0.03]"
            : "border-black/[0.12] bg-white hover:border-black/[0.22] hover:bg-black/[0.01]",
          uploading && "pointer-events-none opacity-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="text-2xl">{dragging ? "📂" : "⬆️"}</span>
        <p className="mt-3 text-[14px] font-medium text-[var(--text-primary)]">
          {dragging ? "Drop to add files" : "Drag & drop files here"}
        </p>
        <p className="mt-1 text-[12px] text-black/40">or click to browse</p>
        <p className="mt-3 text-[11px] text-black/30">
          PDF, JPG, PNG · max 20 MB each · multiple files supported
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        multiple
        className="sr-only"
        onChange={handleFileInput}
        aria-hidden
        disabled={uploading}
      />

      {/* File list */}
      {hasEntries && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FileRow
              key={entry.id}
              entry={entry}
              onRemove={removeEntry}
            />
          ))}
        </div>
      )}

      {/* Summary line */}
      {successCount > 0 && (
        <p className="text-[12px] text-emerald-700">
          {successCount} file{successCount !== 1 ? "s" : ""} uploaded
          successfully. OCR processing has been queued.
        </p>
      )}

      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 rounded-[12px] border border-black/[0.1] bg-white py-3 text-[14px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors disabled:opacity-40"
        >
          {hasEntries ? "Add more files" : "Select files"}
        </button>

        <button
          type="button"
          onClick={handleUploadAll}
          disabled={queuedCount === 0 || uploading}
          className={[
            "flex-1 rounded-[12px] py-3 text-[14px] font-medium transition-opacity",
            queuedCount > 0 && !uploading
              ? "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
              : "cursor-not-allowed bg-black/[0.08] text-black/30",
          ].join(" ")}
        >
          {uploading
            ? "Uploading…"
            : queuedCount > 0
            ? `Upload ${queuedCount} file${queuedCount !== 1 ? "s" : ""}`
            : "Upload"}
        </button>
      </div>
    </div>
  );
}

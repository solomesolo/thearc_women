"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BG_TASKS_CHANGED_EVENT,
  BG_TASKS_STORAGE_KEY,
  BackgroundTask,
  loadBackgroundTasks,
  pruneStaleBackgroundTasks,
  removeBackgroundTask,
} from "@/lib/health-wallet/backgroundProcessing";
import { appendScreeningDocumentUpload } from "@/lib/health-wallet/screeningDocumentUploads";
import type { WalletSyncEntry } from "@/app/api/health-wallet/sync/route";

interface Toast {
  id: string;
  title: string;
  sub: string;
  locale: "en" | "de";
}

function persistWalletEntries(entries: WalletSyncEntry[]) {
  const byKey: Record<string, WalletSyncEntry[]> = {};
  for (const e of entries) {
    if (!byKey[e.biomarkerKey]) byKey[e.biomarkerKey] = [];
    byKey[e.biomarkerKey].push(e);
  }
  for (const [key, list] of Object.entries(byKey)) {
    try {
      const raw = localStorage.getItem(`arc_bm_wallet_${key}`);
      const existing = raw ? (JSON.parse(raw) as object[]) : [];
      const arr = Array.isArray(existing) ? existing : [existing];
      localStorage.setItem(`arc_bm_wallet_${key}`, JSON.stringify([...arr, ...list]));
    } catch { /* ignore */ }
  }
}

export function BackgroundProcessingMonitor() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Tracks which task IDs are currently being polled (survives re-renders)
  const activeRef = useRef<Set<string>>(new Set());
  // Poll timers by task ID, cleared on unmount
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Auto-dismiss timers for toasts
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function addToast(toast: Toast) {
    setToasts((prev) => {
      // Deduplicate by id
      if (prev.some((t) => t.id === toast.id)) return prev;
      return [...prev, toast];
    });
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      dismissTimers.current.delete(toast.id);
    }, 10_000);
    dismissTimers.current.set(toast.id, timer);
  }

  function dismissToast(id: string) {
    const t = dismissTimers.current.get(id);
    if (t) clearTimeout(t);
    dismissTimers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const startPolling = useCallback((task: BackgroundTask) => {
    if (activeRef.current.has(task.id)) return;
    activeRef.current.add(task.id);

    const poll = async (): Promise<void> => {
      // Give up after 10 minutes — the pipeline shouldn't take longer
      if (Date.now() - new Date(task.startedAt).getTime() > 10 * 60 * 1000) {
        removeBackgroundTask(task.id);
        activeRef.current.delete(task.id);
        timersRef.current.delete(task.id);
        return;
      }

      try {
        const res = await fetch(`/api/health-data/upload/${task.docId}/status`);
        if (!res.ok) throw new Error("status check failed");
        const statusData = await res.json();

        if (statusData.isComplete || statusData.hasError) {
          timersRef.current.delete(task.id);

          // Sync wallet entries
          try {
            const syncRes = await fetch("/api/health-wallet/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentId: task.docId,
                uploadKind: task.uploadKind,
              }),
            });
            const syncData = await syncRes.json();

            if (
              task.uploadKind === "screening" &&
              syncData.mode === "screening" &&
              syncData.screeningDraft
            ) {
              const draft = syncData.screeningDraft;
              appendScreeningDocumentUpload({
                id: crypto.randomUUID(),
                documentId: draft.documentId ?? task.docId,
                screeningName: draft.screeningName || task.fileName,
                date: draft.date ?? "",
                findings: draft.findings ?? "",
                fileName: draft.fileName ?? task.fileName,
                fileType: draft.fileType ?? null,
                savedAt: new Date().toISOString(),
              });
              addToast({
                id: task.id,
                title:
                  task.locale === "de"
                    ? "Vorsorge in Health Wallet gespeichert"
                    : "Screening saved to Health Wallet",
                sub: draft.screeningName || task.fileName,
                locale: task.locale,
              });
            } else {
              const entries: WalletSyncEntry[] = syncData.walletEntries ?? [];
              if (entries.length > 0) {
                persistWalletEntries(entries);
                window.dispatchEvent(new Event("arc_wallet_change"));
              }
              const count = entries.length;
              addToast({
                id: task.id,
                title:
                  task.locale === "de"
                    ? count > 0
                      ? `${count} Wert${count === 1 ? "" : "e"} in Health Wallet gespeichert`
                      : "Dokument verarbeitet"
                    : count > 0
                      ? `${count} value${count === 1 ? "" : "s"} added to Health Wallet`
                      : "Document processed",
                sub: task.fileName,
                locale: task.locale,
              });
            }
          } catch {
            addToast({
              id: task.id,
              title:
                task.locale === "de"
                  ? "Dokument verarbeitet"
                  : "Document processed",
              sub: task.fileName,
              locale: task.locale,
            });
          }

          removeBackgroundTask(task.id);
          activeRef.current.delete(task.id);
        } else {
          // Still running — schedule next poll
          timersRef.current.set(task.id, setTimeout(poll, 3000));
        }
      } catch {
        timersRef.current.set(task.id, setTimeout(poll, 5000));
      }
    };

    poll();
  }, []); // stable — only touches refs and stable setters

  const resumePendingTasks = useCallback(() => {
    pruneStaleBackgroundTasks();
    const tasks = loadBackgroundTasks();
    for (const task of tasks) {
      startPolling(task);
    }
  }, [startPolling]);

  useEffect(() => {
    resumePendingTasks();

    function onTasksChanged() {
      resumePendingTasks();
    }
    function onCrossTabStorage(e: StorageEvent) {
      if (e.key === BG_TASKS_STORAGE_KEY) resumePendingTasks();
    }

    window.addEventListener(BG_TASKS_CHANGED_EVENT, onTasksChanged);
    window.addEventListener("storage", onCrossTabStorage);

    return () => {
      window.removeEventListener(BG_TASKS_CHANGED_EVENT, onTasksChanged);
      window.removeEventListener("storage", onCrossTabStorage);
      for (const t of timersRef.current.values()) clearTimeout(t);
      for (const t of dismissTimers.current.values()) clearTimeout(t);
    };
  }, [resumePendingTasks]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Background processing notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto w-[300px] rounded-[16px] bg-[#0c0c0c] px-4 py-3.5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              {/* Success icon */}
              <span className="mt-0.5 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="7" fill="#16a34a" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[0.875rem] font-semibold text-white leading-snug">
                  {toast.title}
                </p>
                <p className="text-[0.775rem] text-white/55 mt-0.5 truncate">{toast.sub}</p>
                <a
                  href="/results/overview"
                  className="mt-2 inline-block text-[0.8125rem] font-semibold text-white/85 underline underline-offset-2 hover:text-white transition-colors"
                >
                  {toast.locale === "de" ? "Zur Health Wallet" : "View Health Wallet"}
                </a>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { HealthCalendarEventMeta } from "@/lib/calendar/localHealthCalendarStore";

function todayISO() {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function AddToHealthCalendarModal({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  initial?: Partial<HealthCalendarEventMeta>;
  onClose: () => void;
  onSave: (meta: HealthCalendarEventMeta) => void;
}) {
  const defaultPlanned = useMemo(() => initial?.plannedDateISO ?? todayISO(), [initial?.plannedDateISO]);

  const [plannedDateISO, setPlannedDateISO] = useState(defaultPlanned);
  const [doctorName, setDoctorName] = useState(initial?.doctorName ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/[0.35] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add to My Health Calendar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[38rem] rounded-[22px] border border-black/[0.10] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
              Add to My Health Calendar
            </p>
            <p className="mt-1 truncate text-[1rem] font-semibold text-[#0c0c0c]">
              {title}
            </p>
            <p className="mt-1 text-[0.875rem] text-[#737373]">
              Choose when this is planned and optionally add details for your visit.
            </p>
          </div>
          <button
            type="button"
            className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#737373]">
              Planned date
            </label>
            <input
              type="date"
              value={plannedDateISO}
              onChange={(e) => setPlannedDateISO(e.target.value)}
              className="mt-1.5 w-full rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3 text-[0.9375rem] text-[#0c0c0c] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0c0c]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[0.8125rem] font-medium text-[#737373]">
                Doctor or clinic (optional)
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Name of doctor or clinic"
                className="mt-1.5 w-full rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0c0c]"
              />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-[#737373]">
                Address (optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city"
                className="mt-1.5 w-full rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0c0c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.8125rem] font-medium text-[#737373]">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add anything you want to remember, like prep instructions, appointment time, or questions."
              className="mt-1.5 w-full resize-none rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0c0c]"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.9]"
            onClick={() => {
              const meta: HealthCalendarEventMeta = {
                plannedDateISO: plannedDateISO || todayISO(),
                doctorName: doctorName.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
              };
              onSave(meta);
            }}
          >
            Add to calendar
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#737373] hover:text-[#0c0c0c]"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


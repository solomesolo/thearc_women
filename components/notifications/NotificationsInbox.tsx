"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { NotificationRow } from "@/lib/knowledge/types";

const TYPE_LABEL: Record<string, string> = {
  action_critical: "Action",
  knowledge_update: "Update",
  system_reminder: "Reminder",
};

const TYPE_DOT: Record<string, string> = {
  action_critical: "bg-red-400",
  knowledge_update: "bg-sky-400",
  system_reminder: "bg-amber-400",
};

const FILTERS = ["all", "action_critical", "knowledge_update", "system_reminder"] as const;

export function NotificationsInbox({
  initialNotifications,
  unreadCount: initialUnread,
}: {
  initialNotifications: NotificationRow[];
  unreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-black/[0.07] pb-5 mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="text-[13px] text-black/45 hover:text-black/70 transition-colors disabled:opacity-40"
            >
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={clsx(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                filter === f
                  ? "border-black/90 bg-black/90 text-white"
                  : "border-black/[0.09] text-black/50 hover:border-black/[0.2]"
              )}
            >
              {f === "all" ? "All" : TYPE_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-black/[0.12] px-8 py-12 text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">No notifications here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li key={n.id}>
              <div
                className={clsx(
                  "rounded-[16px] border px-5 py-4 transition-colors",
                  n.isRead
                    ? "border-black/[0.07] bg-white"
                    : "border-black/[0.1] bg-[#fdf8f5]"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.isRead ? "bg-black/15" : (TYPE_DOT[n.type] ?? "bg-amber-400")
                    )}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={clsx("text-[14px] leading-[1.4]", n.isRead ? "text-[var(--text-secondary)] font-normal" : "text-[var(--text-primary)] font-semibold")}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-black/35">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)] leading-[1.55]">
                      {n.body}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          onClick={() => !n.isRead && markRead(n.id)}
                          className="text-[12px] font-medium text-[var(--text-primary)] underline underline-offset-2 hover:opacity-70 transition-opacity"
                        >
                          View →
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="text-[12px] text-black/35 hover:text-black/60 transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

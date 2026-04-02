"use client";

import Link from "next/link";
import { useState } from "react";
import type { CollectionWithCount } from "@/lib/knowledge/types";
import { CollectionCard } from "./CollectionCard";

const COLOR_OPTIONS = [
  { key: "stone",  label: "Gray" },
  { key: "rose",   label: "Rose" },
  { key: "teal",   label: "Teal" },
  { key: "amber",  label: "Amber" },
  { key: "violet", label: "Violet" },
  { key: "sky",    label: "Sky" },
];

const COLOR_DOT: Record<string, string> = {
  stone: "bg-stone-300", rose: "bg-rose-300", teal: "bg-teal-300",
  amber: "bg-amber-300", violet: "bg-violet-300", sky: "bg-sky-300",
};

export function CollectionsGrid({
  isLoggedIn = true,
  initialCollections,
}: {
  isLoggedIn?: boolean;
  initialCollections: CollectionWithCount[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState("stone");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), colorKey }),
      });
      if (res.ok) {
        const newCol: CollectionWithCount = await res.json();
        setCollections((prev) => [newCol, ...prev]);
        setName("");
        setColorKey("stone");
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (collections.length === 0 && !showForm) {
    return (
      <div className="rounded-[16px] border border-dashed border-black/[0.12] px-6 py-8 text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          {isLoggedIn
            ? "Organise your saved articles into collections."
            : "Sign in to organise saved articles into collections."}
        </p>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-3 inline-block text-[13px] font-medium text-[var(--text-primary)] underline underline-offset-2"
          >
            + Create collection
          </button>
        ) : (
          <Link
            href="/login?callbackUrl=/knowledge"
            className="mt-3 inline-block text-[13px] font-semibold text-[var(--text-primary)] underline underline-offset-2"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {collections.map((c) => (
          <CollectionCard key={c.id} collection={c} />
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="rounded-[14px] border border-black/[0.09] bg-white p-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            className="w-full rounded-[10px] border border-black/[0.09] bg-[#f8f7f5] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-black/35 focus:outline-none focus:border-black/[0.25]"
            maxLength={60}
          />
          <div className="mt-3 flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColorKey(c.key)}
                className={`h-5 w-5 rounded-full ${COLOR_DOT[c.key]} ring-offset-1 transition-all ${colorKey === c.key ? "ring-2 ring-black/40" : ""}`}
                aria-label={c.label}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="rounded-[10px] bg-black/90 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40 hover:opacity-85 transition-opacity"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setName(""); }}
              className="rounded-[10px] border border-black/[0.09] px-4 py-2 text-[12px] text-[var(--text-secondary)] hover:border-black/[0.2] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span aria-hidden className="text-[16px] leading-none">+</span>
          Create collection
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Nomination = {
  id: string;
  friendName: string;
  friendEmail: string;
  inviteCode: string | null;
  createdAt: string;
};

const MAX_NOMINATIONS = 2;

export function NominationModule() {
  const { data: session } = useSession();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/nominations")
      .then((r) => r.json())
      .then((data) => {
        setNominations(data.nominations ?? []);
        setCount(data.count ?? 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [session?.user?.email]);

  const canNominate = count < MAX_NOMINATIONS;
  const canSubmit = friendName.trim().length > 0 && friendEmail.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting || !canNominate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendName: friendName.trim(), friendEmail: friendEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setCount((c) => c + 1);
        setNominations((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            friendName: friendName.trim(),
            friendEmail: friendEmail.trim(),
            inviteCode: null,
            createdAt: new Date().toISOString(),
          },
        ]);
        setFriendName("");
        setFriendEmail("");
        setTimeout(() => setSuccess(false), 4000);
      } else if (data.error === "nomination_limit_reached") {
        setError("You've reached the maximum of 2 nominations.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session?.user?.email || !loaded) return null;

  return (
    <div className="mt-10 rounded-[24px] border border-black/[0.08] bg-[#fafaf9] px-6 py-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
            Bring someone in
          </p>
          <h3 className="mt-1.5 text-[1.1875rem] font-medium leading-[1.3] tracking-tight text-[#0c0c0c]">
            Bring someone into The Arc
          </h3>
          <p className="mt-2 max-w-[38rem] text-[0.9rem] leading-[1.6] text-[#525252]">
            Nominate someone you care about to begin their health arc too.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-white px-3 py-1 text-[0.75rem] font-semibold text-[#525252] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
          {MAX_NOMINATIONS - count} left
        </div>
      </div>

      {nominations.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {nominations.map((n) => (
            <li key={n.id} className="flex items-center gap-3 rounded-[14px] border border-black/[0.06] bg-white px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f4f2] text-[0.75rem] font-semibold text-[#525252]">
                {n.friendName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.875rem] font-medium text-[#0c0c0c]">{n.friendName}</p>
                <p className="truncate text-[0.8125rem] text-[#737373]">{n.friendEmail}</p>
              </div>
              <div className="shrink-0 rounded-full bg-[#f4f4f2] px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#525252]">
                Invited
              </div>
            </li>
          ))}
        </ul>
      )}

      {canNominate ? (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="nom-name" className="text-[0.8125rem] font-medium text-[#404040]">
              Friend's first name
            </label>
            <input
              id="nom-name"
              type="text"
              autoComplete="off"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-2.5 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/30 focus:outline-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="nom-email" className="text-[0.8125rem] font-medium text-[#404040]">
              Friend's email
            </label>
            <input
              id="nom-email"
              type="email"
              autoComplete="off"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-2.5 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/30 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-[44px] shrink-0 rounded-[12px] bg-[#0c0c0c] px-6 text-[0.875rem] font-semibold text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40 sm:self-end"
          >
            {submitting ? "Sending…" : "Send nomination"}
          </button>
        </form>
      ) : (
        <p className="mt-5 text-[0.875rem] text-[#737373]">
          You've used all your nominations. Thank you for bringing others into The Arc.
        </p>
      )}

      {success && (
        <p className="mt-3 text-[0.875rem] font-medium text-[#0c0c0c]">
          Nomination sent — your friend will receive an invitation.
        </p>
      )}
      {error && (
        <p className="mt-3 text-[0.8125rem] text-red-500">{error}</p>
      )}
    </div>
  );
}

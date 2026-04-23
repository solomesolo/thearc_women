"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ENGINE_A_STORAGE, apiBuildProfile, apiClaimSession, apiGetLatestProfile, apiGetLatestQuestionnaireSession } from "@/lib/profile-engine-a/frontendClient";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "signin">("register");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        const sessionId = typeof window !== "undefined" ? window.localStorage.getItem(ENGINE_A_STORAGE.sessionId) : null;
        if (sessionId) {
          await apiClaimSession(sessionId).catch(() => null);
          // Claim profile snapshot to auth email and get the snapshot ID.
          const built = await apiBuildProfile(sessionId).catch(() => null);
          const profileSnapshotId = built?.profile_snapshot_id as string | undefined;
          if (profileSnapshotId) {
            // Re-run recommendations + status + score under the auth email so
            // RecommendationInstance records exist for this user on first dashboard visit.
            await fetch(`/api/recommendations/run/${encodeURIComponent(profileSnapshotId)}`, { method: "POST" }).catch(() => null);
            await fetch("/api/status/recalculate", { method: "POST" }).catch(() => null);
            await fetch("/api/health-score/calculate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }).catch(() => null);
          }
        }
        router.push("/results/overview");
      } else {
        router.push("/results/overview");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        const latest = await apiGetLatestQuestionnaireSession().catch(() => ({ session: null }));
        if (latest.session?.status === "in_progress") {
          const step = latest.session.last_step_number;
          if (step <= 0) router.push("/onboarding/basics");
          else if (step === 1) router.push("/onboarding/lifestyle");
          else if (step === 2) router.push("/onboarding/health-context");
          else if (step === 3) router.push("/onboarding/test-history");
          else router.push("/auth/register");
          return;
        }

        const sessionId = typeof window !== "undefined" ? window.localStorage.getItem(ENGINE_A_STORAGE.sessionId) : null;
        if (sessionId) {
          await apiClaimSession(sessionId).catch(() => null);
          const built = await apiBuildProfile(sessionId).catch(() => null);
          const profileSnapshotId = built?.profile_snapshot_id as string | undefined;
          if (profileSnapshotId) {
            await fetch(`/api/recommendations/run/${encodeURIComponent(profileSnapshotId)}`, { method: "POST" }).catch(() => null);
            await fetch("/api/status/recalculate", { method: "POST" }).catch(() => null);
            await fetch("/api/health-score/calculate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }).catch(() => null);
          }
        }

        const active = await apiGetLatestProfile().catch(() => ({ profile: null }));
        if (active.profile) {
          router.push("/app/dashboard");
          return;
        }
        router.push("/results/overview");
      } else {
        setError("Incorrect email or password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell narrow>
      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="8" r="4" stroke="#0c0c0c" strokeWidth="1.5" />
            <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
          {mode === "register" ? "Save your results" : "Welcome back"}
        </h2>
        <p className="mt-2 text-[0.9375rem] text-[#737373]">
          {mode === "register"
            ? "Create a free account to keep your personalized recommendations."
            : "Sign in to access your saved results."}
        </p>
      </div>

      {/* Skip option */}
      {mode === "register" && (
        <div className="mt-5 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] p-4 text-center">
          <p className="text-[0.875rem] text-[#737373]">
            Don't want to save?{" "}
            <Link
              href="/results/overview"
              className="font-medium text-[#0c0c0c] underline underline-offset-2"
            >
              View results without an account
            </Link>
          </p>
        </div>
      )}

      <form
        onSubmit={mode === "register" ? handleRegister : handleSignIn}
        className="mt-6 space-y-3"
      >
        {mode === "register" && (
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-[#404040]">
              Your name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna"
              autoComplete="name"
              className="w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#c4c4c4] focus:border-[#0c0c0c]/[0.4] focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-[#404040]">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#c4c4c4] focus:border-[#0c0c0c]/[0.4] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-[#404040]">
            Password {mode === "register" && <span className="text-[#a3a3a3] font-normal">(min. 8 characters)</span>}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#c4c4c4] focus:border-[#0c0c0c]/[0.4] focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-[10px] bg-red-50 px-4 py-2.5 text-[0.875rem] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "..."
            : mode === "register"
            ? "Create account and see results"
            : "Sign in"}
        </button>
      </form>

      {/* Toggle mode */}
      <div className="mt-5 text-center">
        {mode === "register" ? (
          <p className="text-[0.875rem] text-[#737373]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); }}
              className="font-medium text-[#0c0c0c] underline underline-offset-2"
            >
              Sign in
            </button>
          </p>
        ) : (
          <p className="text-[0.875rem] text-[#737373]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className="font-medium text-[#0c0c0c] underline underline-offset-2"
            >
              Create one
            </button>
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-[0.75rem] text-[#c4c4c4]">
        Your data is stored securely and never sold to third parties.
      </p>
    </OnboardingShell>
  );
}

"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/blog";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      setLoading(false);
      if (res?.error) {
        setError("Invalid email or password.");
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      if (res === undefined) {
        setError("Sign-in failed. Check that NEXTAUTH_SECRET is set and the server is running.");
        return;
      }
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Try again or check the server.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <Container className="py-16 max-w-md">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Use your credentials to access gated content and personalization.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[14px] bg-[var(--foreground)] py-3 text-[var(--background)] font-medium hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-[var(--text-secondary)]">
          MVP: use the demo credentials from .env (e.g. demo@thearc.com / demo).
        </p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]">
          ← Back to Blog
        </Link>
      </Container>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Container className="py-16 max-w-md"><p className="text-[var(--text-secondary)]">Loading…</p></Container>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

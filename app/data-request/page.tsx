"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalParagraph,
} from "@/components/legal/LegalPageLayout";

const REQUEST_TYPES = [
  { value: "access", label: "Access" },
  { value: "deletion", label: "Deletion" },
  { value: "correction", label: "Correction" },
  { value: "portability", label: "Portability" },
] as const;

export default function DataRequestPage() {
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<string>("access");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, requestType, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong");
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMessage("Failed to submit. Please try again.");
      setStatus("error");
    }
  }

  return (
    <LegalPageLayout title="Data rights request">
      <LegalParagraph>
        You can request access to your data, deletion of your account, correction
        of your data, or data portability. Submit the form below and we will
        respond to the email address you provide.
      </LegalParagraph>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full max-w-md rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--text-primary)]/40 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="requestType"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Request type
          </label>
          <select
            id="requestType"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="mt-2 w-full max-w-md rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--text-primary)]/40 focus:outline-none"
          >
            {REQUEST_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Message (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-2 w-full max-w-md rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--text-primary)]/40 focus:outline-none"
            placeholder="Additional details..."
          />
        </div>

        {status === "success" && (
          <p className="text-sm text-[var(--accent)]">
            Your request has been received. We will respond to the email address
            you provided.
          </p>
        )}
        {status === "error" && errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-[14px] border border-[var(--foreground)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--foreground)]/0.06 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Submit request"}
        </button>
      </form>

      <p className="pt-4 text-sm text-[var(--text-secondary)]">
        <Link href="/" className="underline hover:text-[var(--text-primary)]">
          Back to home
        </Link>
      </p>
    </LegalPageLayout>
  );
}

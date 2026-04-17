"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalParagraph,
} from "@/components/legal/LegalPageLayout";

const REQUEST_TYPES = [
  { value: "access", label: "Auskunft" },
  { value: "deletion", label: "Löschung" },
  { value: "correction", label: "Berichtigung" },
  { value: "portability", label: "Datenübertragbarkeit" },
] as const;

export default function DataRequestDEPage() {
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
        setErrorMessage(data.error || "Ein Fehler ist aufgetreten.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMessage("Übermittlung fehlgeschlagen. Bitte versuche es erneut.");
      setStatus("error");
    }
  }

  return (
    <LegalPageLayout title="Datenschutzanfrage">
      <LegalParagraph>
        Du kannst Auskunft über deine Daten, Löschung deines Kontos, Berichtigung deiner Daten oder Datenübertragbarkeit beantragen. Fülle das folgende Formular aus und wir antworten an die von dir angegebene E-Mail-Adresse.
      </LegalParagraph>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full max-w-md rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--text-primary)]/40 focus:outline-none"
            placeholder="du@beispiel.com"
          />
        </div>

        <div>
          <label
            htmlFor="requestType"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Art der Anfrage
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
            Nachricht (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-2 w-full max-w-md rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--text-primary)]/40 focus:outline-none"
            placeholder="Weitere Details..."
          />
        </div>

        {status === "success" && (
          <p className="text-sm text-[var(--accent)]">
            Deine Anfrage wurde erhalten. Wir antworten an die von dir angegebene E-Mail-Adresse.
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
          {status === "loading" ? "Wird gesendet…" : "Anfrage senden"}
        </button>
      </form>

      <p className="pt-4 text-sm text-[var(--text-secondary)]">
        <Link href="/de" className="underline hover:text-[var(--text-primary)]">
          Zur Startseite
        </Link>
      </p>
    </LegalPageLayout>
  );
}

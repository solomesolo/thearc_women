import { createHmac } from "crypto";

const secret = () => process.env.NEXTAUTH_SECRET ?? "dev-secret";

// ── Signed ICS feed tokens ─────────────────────────────────────────────────
// Token encodes the user email so the ICS endpoint works even without a DB row.
// Format: base64url(email) + "." + 16-char HMAC signature

export function signFeedToken(email: string): string {
  const payload = Buffer.from(email).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

export function verifyFeedToken(token: string): string | null {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 16);
    if (sig !== expected) return null;
    return Buffer.from(payload, "base64url").toString(); // email
  } catch {
    return null;
  }
}
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function encodeState(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function decodeState(state: string): string | null {
  try {
    const raw = Buffer.from(state, "base64url").toString();
    const lastColon = raw.lastIndexOf(":");
    if (lastColon === -1) return null;
    const payload = raw.slice(0, lastColon);
    const sig = raw.slice(lastColon + 1);
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig !== expected) return null;
    const tsStart = payload.lastIndexOf(":");
    if (tsStart === -1) return null;
    const ts = parseInt(payload.slice(tsStart + 1));
    if (Date.now() - ts > TTL_MS) return null;
    return payload.slice(0, tsStart); // email
  } catch {
    return null;
  }
}

export function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

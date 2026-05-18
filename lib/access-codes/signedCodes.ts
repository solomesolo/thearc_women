import { createHmac, randomBytes } from "crypto";

const secret = () => process.env.NEXTAUTH_SECRET ?? "dev-secret";
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function randomCode(): string {
  const buf = randomBytes(6);
  let s = "ARC-";
  for (let i = 0; i < 6; i++) s += CHARS[buf[i] % CHARS.length];
  return s;
}

// Format: code + "." + base64url(ownerEmail + ":" + expiresAt) + "." + 16-char HMAC
export function signAccessCode(ownerEmail: string): { code: string; token: string; expiresAt: Date } {
  const code = randomCode();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const payload = Buffer.from(`${ownerEmail}:${expiresAt.toISOString()}`).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`${code}.${payload}`).digest("hex").slice(0, 16);
  return { code, token: `${code}.${payload}.${sig}`, expiresAt };
}

export function verifyAccessCode(token: string): { code: string; ownerEmail: string; expiresAt: Date } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [code, payload, sig] = parts;
    const expected = createHmac("sha256", secret()).update(`${code}.${payload}`).digest("hex").slice(0, 16);
    if (sig !== expected) return null;
    const decoded = Buffer.from(payload, "base64url").toString();
    const colonIdx = decoded.lastIndexOf(":");
    if (colonIdx === -1) return null;
    const ownerEmail = decoded.slice(0, colonIdx);
    const expiresAt = new Date(decoded.slice(colonIdx + 1));
    if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) return null;
    return { code, ownerEmail, expiresAt };
  } catch {
    return null;
  }
}

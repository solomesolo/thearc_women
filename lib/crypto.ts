import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;

/** Returns a `salt:hash` string to store in the database. */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifies a plaintext password against a stored `salt:hash` string. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, KEY_LEN);
  const storedBuf = Buffer.from(storedHash, "hex");
  if (hash.length !== storedBuf.length) return false;
  return timingSafeEqual(hash, storedBuf);
}

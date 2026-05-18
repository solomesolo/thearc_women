import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export type Access = { isLoggedIn: boolean; isSubscriber: boolean };

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
}

// ── Per-process subscriber status cache ──────────────────────────────────────
// Keyed by email, 10-minute TTL. Survives HMR via global.
declare global {
  // eslint-disable-next-line no-var
  var _subscriberCache: Map<string, { isActive: boolean; ts: number }> | undefined;
}
const SUBSCRIBER_CACHE: Map<string, { isActive: boolean; ts: number }> =
  global._subscriberCache ?? (global._subscriberCache = new Map());
const SUBSCRIBER_TTL_MS = 10 * 60 * 1000;

function getCachedSubscriber(email: string): boolean | null {
  const entry = SUBSCRIBER_CACHE.get(email);
  if (!entry) return null;
  if (Date.now() - entry.ts > SUBSCRIBER_TTL_MS) { SUBSCRIBER_CACHE.delete(email); return null; }
  return entry.isActive;
}
function setCachedSubscriber(email: string, isActive: boolean) {
  SUBSCRIBER_CACHE.set(email, { isActive, ts: Date.now() });
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // 1. Check hardcoded test accounts (backwards-compat)
        const expectedPassword = process.env.CREDENTIALS_PASSWORD ?? "demo";
        const defaultEmails = "demo@thearc.com,iron@test.com,stress@test.com,sugar@test.com,baseline@test.com";
        const allowedEmails = (process.env.CREDENTIALS_EMAIL ?? defaultEmails)
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        if (allowedEmails.length === 0) allowedEmails.push("demo@thearc.com");
        if (allowedEmails.includes(email) && password === expectedPassword) {
          return { id: email, email, name: email };
        }

        // 2. Check registered AppUser in DB
        try {
          const appUser = await prisma.appUser.findUnique({ where: { email } });
          if (appUser) {
            const { verifyPassword } = await import("@/lib/crypto");
            const valid = verifyPassword(password, appUser.hashedPassword);
            if (valid) return { id: appUser.id, email: appUser.email, name: appUser.name ?? appUser.email };
          }
        } catch {
          // DB unavailable — fall through
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (!session?.user) return session;
      const email = token.email as string;
      session.user.email = email;

      const disableLookup = process.env.DISABLE_SUBSCRIBER_LOOKUP === "1";
      if (disableLookup) {
        (session.user as { isSubscriber?: boolean }).isSubscriber = false;
        return session;
      }

      // Check in-process cache first — avoids a DB round-trip on every page load.
      const cached = getCachedSubscriber(email);
      if (cached !== null) {
        (session.user as { isSubscriber?: boolean }).isSubscriber = cached;
        return session;
      }

      // Tight timeout: subscriber status is optional UI sugar, never worth blocking on.
      const lookupTimeoutMs = Number(process.env.SUBSCRIBER_LOOKUP_TIMEOUT_MS ?? 400);
      try {
        const sub = await withTimeout(
          prisma.subscriber.findUnique({ where: { email } }),
          lookupTimeoutMs,
          `subscriber_lookup_timeout`,
        );
        const isActive = sub?.isActive ?? false;
        setCachedSubscriber(email, isActive);
        (session.user as { isSubscriber?: boolean }).isSubscriber = isActive;
      } catch {
        // Keep session fast — subscriber status is optional.
        setCachedSubscriber(email, false);
        (session.user as { isSubscriber?: boolean }).isSubscriber = false;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-change-in-production" : undefined),
};

/** Returns { isLoggedIn, isSubscriber } for the current session. Use in Server Components or Route Handlers. */
export async function getUserAccess(): Promise<Access> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { isLoggedIn: false, isSubscriber: false };
  const u = session.user as { isSubscriber?: boolean };
  return {
    isLoggedIn: true,
    isSubscriber: u.isSubscriber ?? false,
  };
}

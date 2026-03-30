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
        const expectedPassword = process.env.CREDENTIALS_PASSWORD ?? "demo";
        const defaultEmails = "demo@thearc.com,iron@test.com,stress@test.com,sugar@test.com,baseline@test.com";
        const allowedEmails = (process.env.CREDENTIALS_EMAIL ?? defaultEmails)
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        if (allowedEmails.length === 0) allowedEmails.push("demo@thearc.com");
        if (!allowedEmails.includes(email) || password !== expectedPassword) return null;
        return { id: email, email, name: email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        const disableLookup = process.env.DISABLE_SUBSCRIBER_LOOKUP === "1";
        const lookupTimeoutMs = Number(process.env.SUBSCRIBER_LOOKUP_TIMEOUT_MS ?? 1500);
        if (disableLookup) {
          (session.user as { isSubscriber?: boolean }).isSubscriber = false;
          return session;
        }

        try {
          const sub = await withTimeout(
            prisma.subscriber.findUnique({
              where: { email: token.email as string },
            }),
            lookupTimeoutMs,
            `subscriber_lookup_timeout_${lookupTimeoutMs}ms`
          );
          (session.user as { isSubscriber?: boolean }).isSubscriber = sub?.isActive ?? false;
        } catch {
          // Keep auth/session fast and resilient; subscriber status is optional UI personalization.
          (session.user as { isSubscriber?: boolean }).isSubscriber = false;
        }
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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Use in API routes. Returns session or null; null means 401 for admin. */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  return session ?? null;
}

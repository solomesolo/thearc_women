import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotifications, getUnreadCount } from "@/lib/notifications/queries";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filter = (new URL(req.url).searchParams.get("filter") ?? "all") as "all" | "unread";
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(session.user.email, filter),
    getUnreadCount(session.user.email),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

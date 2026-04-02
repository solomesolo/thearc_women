import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentlyViewed, getSavedArticles, getCollections } from "@/lib/knowledge/queries";
import { getUnreadCount } from "@/lib/notifications/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const [recentlyViewed, saved, collections, unreadNotifications] = await Promise.all([
    getRecentlyViewed(email, 8),
    getSavedArticles(email),
    getCollections(email),
    getUnreadCount(email),
  ]);

  return NextResponse.json({ recentlyViewed, saved, collections, unreadNotifications });
}

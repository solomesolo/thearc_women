import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { KnowledgeDashboard } from "@/components/knowledge/KnowledgeDashboard";
import { getRecentlyViewed, getSavedArticles, getCollections } from "@/lib/knowledge/queries";
import { getUnreadCount } from "@/lib/notifications/queries";

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <Container className="py-10 md:py-14">
        <KnowledgeDashboard
          data={{
            isLoggedIn: false,
            recentlyViewed: [],
            saved: [],
            collections: [],
            unreadNotifications: 0,
          }}
        />
      </Container>
    );
  }

  const [recentlyViewed, saved, collections, unreadNotifications] = await Promise.all([
    getRecentlyViewed(email, 8),
    getSavedArticles(email),
    getCollections(email),
    getUnreadCount(email),
  ]);

  return (
    <Container className="py-10 md:py-14">
      <KnowledgeDashboard
        data={{
          isLoggedIn: true,
          recentlyViewed,
          saved,
          collections,
          unreadNotifications,
        }}
      />
    </Container>
  );
}

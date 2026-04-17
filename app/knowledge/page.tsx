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

  let recentlyViewed: Awaited<ReturnType<typeof getRecentlyViewed>> = [];
  let saved: Awaited<ReturnType<typeof getSavedArticles>> = [];
  let collections: Awaited<ReturnType<typeof getCollections>> = [];
  let unreadNotifications = 0;

  try {
    recentlyViewed = await getRecentlyViewed(email, 8);
  } catch (err) {
    console.error("[knowledge page] getRecentlyViewed failed", err);
  }
  try {
    saved = await getSavedArticles(email);
  } catch (err) {
    console.error("[knowledge page] getSavedArticles failed", err);
  }
  try {
    collections = await getCollections(email);
  } catch (err) {
    console.error("[knowledge page] getCollections failed", err);
  }
  try {
    unreadNotifications = await getUnreadCount(email);
  } catch (err) {
    console.error("[knowledge page] getUnreadCount failed", err);
  }

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

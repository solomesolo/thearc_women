import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { getNotifications, getUnreadCount } from "@/lib/notifications/queries";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login?callbackUrl=/notifications");

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let unreadCount = 0;
  try {
    notifications = await getNotifications(email);
  } catch (err) {
    console.error("[notifications page] getNotifications failed", err);
  }
  try {
    unreadCount = await getUnreadCount(email);
  } catch (err) {
    console.error("[notifications page] getUnreadCount failed", err);
  }

  return (
    <Container className="py-10 md:py-14">
      <NotificationsInbox
        initialNotifications={notifications}
        unreadCount={unreadCount}
      />
    </Container>
  );
}

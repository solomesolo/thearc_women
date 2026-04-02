import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { getNotifications, getUnreadCount } from "@/lib/notifications/queries";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const email = session!.user!.email!;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(email),
    getUnreadCount(email),
  ]);

  return (
    <Container className="py-10 md:py-14">
      <NotificationsInbox
        initialNotifications={notifications}
        unreadCount={unreadCount}
      />
    </Container>
  );
}

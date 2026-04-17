import { prisma } from "@/lib/db";
import type { NotificationRow } from "@/lib/knowledge/types";

function toRow(r: {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
}): NotificationRow {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    isRead: r.isRead,
    actionUrl: r.actionUrl,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getNotifications(
  email: string,
  filter: "all" | "unread" = "all"
): Promise<NotificationRow[]> {
  const rows = await prisma.userNotification.findMany({
    where: { email, ...(filter === "unread" ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(toRow);
}

export async function getUnreadCount(email: string): Promise<number> {
  return prisma.userNotification.count({ where: { email, isRead: false } });
}

export async function markRead(email: string, id: number): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { id, email },
    data: { isRead: true },
  });
}

export async function markAllRead(email: string): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { email, isRead: false },
    data: { isRead: true },
  });
}

export async function createNotification(
  email: string,
  data: { type: string; title: string; body: string; actionUrl?: string }
): Promise<NotificationRow> {
  const row = await prisma.userNotification.create({
    data: { email, ...data },
  });
  return toRow(row);
}

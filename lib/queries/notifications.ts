import { prisma } from "@/lib/db";

export async function getUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      scorecard: {
        include: { airline: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

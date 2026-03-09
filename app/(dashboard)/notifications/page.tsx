export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserNotifications, getUnreadCount } from "@/lib/queries/notifications";
import { NotificationsClient } from "@/components/eis/notifications-client";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="instrument-panel rounded p-12 text-center">
        <p className="text-muted-foreground">Please sign in to view notifications.</p>
      </div>
    );
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(userId),
    getUnreadCount(userId),
  ]);

  return (
    <NotificationsClient
      notifications={JSON.parse(JSON.stringify(notifications))}
      initialUnreadCount={unreadCount}
    />
  );
}

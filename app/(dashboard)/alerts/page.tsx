export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserNotifications, getUnreadCount } from "@/lib/queries/notifications";
import { AlertsClient } from "@/components/eis/alerts-client";

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="panel rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Please sign in to view alerts.</p>
      </div>
    );
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(userId),
    getUnreadCount(userId),
  ]);

  return (
    <AlertsClient
      notifications={JSON.parse(JSON.stringify(notifications))}
      unreadCount={unreadCount}
    />
  );
}

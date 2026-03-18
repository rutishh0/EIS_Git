export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats, getSystemStatus } from "@/lib/queries/dashboard";
import { getOffPlanPrograms, getRecentComments, getCategoryData } from "@/lib/queries/category";
import { getUserNotifications } from "@/lib/queries/notifications";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { DashboardClient } from "@/components/eis/dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const allServiceLines = Object.values(SERVICE_LINE_CATEGORIES).flat();

  const [stats, systemStatus, offPlanPrograms, recentComments, heatmapData, notifications] =
    await Promise.all([
      getDashboardStats(),
      getSystemStatus(),
      getOffPlanPrograms(),
      getRecentComments(8),
      getCategoryData(allServiceLines),
      userId ? getUserNotifications(userId, 5) : Promise.resolve([]),
    ]);

  return (
    <DashboardClient
      stats={stats}
      systemStatus={JSON.parse(JSON.stringify(systemStatus))}
      offPlanPrograms={JSON.parse(JSON.stringify(offPlanPrograms))}
      recentComments={JSON.parse(JSON.stringify(recentComments))}
      heatmapData={JSON.parse(JSON.stringify(heatmapData))}
      notifications={JSON.parse(JSON.stringify(notifications))}
    />
  );
}

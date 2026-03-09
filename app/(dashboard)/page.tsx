export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDashboardStats,
  getPortfolioOverview,
  getSystemStatus,
} from "@/lib/queries/dashboard";
import { getUserNotifications } from "@/lib/queries/notifications";
import { DashboardClient } from "@/components/eis/dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [stats, portfolio, systemStatus, notifications] = await Promise.all([
    getDashboardStats(),
    getPortfolioOverview(),
    getSystemStatus(),
    userId ? getUserNotifications(userId, 10) : Promise.resolve([]),
  ]);

  return (
    <DashboardClient
      stats={stats}
      portfolio={JSON.parse(JSON.stringify(portfolio))}
      systemStatus={JSON.parse(JSON.stringify(systemStatus))}
      notifications={JSON.parse(JSON.stringify(notifications))}
    />
  );
}

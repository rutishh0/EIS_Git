export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { ReportsClient } from "@/components/eis/reports-client";

export default async function ReportsPage() {
  const airlines = await prisma.airline.findMany({
    include: { scorecard: { select: { id: true, status: true } } },
    orderBy: { name: "asc" },
  });

  const airlineOptions = airlines
    .filter((a) => a.scorecard)
    .map((a) => ({
      id: a.id,
      name: a.name,
      status: a.scorecard!.status,
    }));

  return <ReportsClient airlines={JSON.parse(JSON.stringify(airlineOptions))} />;
}

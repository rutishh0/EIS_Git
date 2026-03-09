import { prisma } from "@/lib/db";
import type { RagStatus } from "@/lib/generated/prisma/client";

export async function getTimelineData() {
  const scorecards = await prisma.scorecard.findMany({
    where: { status: "ACTIVE" },
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      gateReviews: { orderBy: { gateNumber: "asc" } },
      serviceLineStatuses: { select: { ragStatus: true } },
    },
    orderBy: { eisDate: "asc" },
  });

  return scorecards
    .filter((sc) => sc.eisDate)
    .map((sc) => {
      const ragStatuses = sc.serviceLineStatuses.map((s) => s.ragStatus) as RagStatus[];
      let overallRag: RagStatus = "G";
      if (ragStatuses.includes("R")) overallRag = "R";
      else if (ragStatuses.includes("A")) overallRag = "A";
      else if (ragStatuses.every((s) => s === "C" || s === "NA")) overallRag = "C";

      return {
        airlineId: sc.airlineId,
        airlineName: sc.airline.name,
        region: sc.airline.region,
        engineType: sc.engineType,
        eisDate: sc.eisDate!,
        eisLead: sc.eisLead?.displayName || "TBC",
        overallRag,
        gates: sc.gateReviews.map((gr) => ({
          gateNumber: gr.gateNumber,
          planDate: gr.planDate,
          actualDate: gr.actualDate,
          outcome: gr.outcome,
        })),
      };
    });
}

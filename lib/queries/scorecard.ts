import { prisma } from "@/lib/db";

export async function getAllAirlines() {
  const scorecards = await prisma.scorecard.findMany({
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      serviceLineStatuses: { select: { ragStatus: true } },
      gateReviews: { orderBy: { gateNumber: "asc" } },
    },
    orderBy: { airline: { name: "asc" } },
  });

  return scorecards.map((sc) => ({
    id: sc.airlineId,
    name: sc.airline.name,
    region: sc.airline.region,
    engineType: sc.engineType,
    eisDate: sc.eisDate,
    eisDateTbc: sc.eisDateTbc,
    eisRisk: sc.eisRisk,
    eisLead: sc.eisLead?.displayName || "TBC",
    status: sc.status,
    lastUpdatedAt: sc.lastUpdatedAt,
    ragStatuses: sc.serviceLineStatuses.map((s) => s.ragStatus),
    gateReviews: sc.gateReviews.map((gr) => ({
      gateNumber: gr.gateNumber,
      outcome: gr.outcome,
    })),
  }));
}

export async function getScorecardByAirlineId(airlineId: string) {
  const scorecard = await prisma.scorecard.findFirst({
    where: { airlineId },
    include: {
      airline: true,
      eisLead: { select: { id: true, displayName: true } },
      lastUpdatedBy: { select: { displayName: true } },
      gateReviews: { orderBy: { gateNumber: "asc" } },
      serviceLineStatuses: {
        include: { serviceLine: true },
        orderBy: { serviceLine: { sortOrder: "asc" } },
      },
    },
  });

  if (!scorecard) return null;

  return {
    id: scorecard.id,
    airlineId: scorecard.airlineId,
    airlineName: scorecard.airline.name,
    region: scorecard.airline.region,
    engineType: scorecard.engineType,
    eisDate: scorecard.eisDate,
    eisDateTbc: scorecard.eisDateTbc,
    eisRisk: scorecard.eisRisk,
    eisLead: scorecard.eisLead
      ? { id: scorecard.eisLead.id, name: scorecard.eisLead.displayName }
      : null,
    orderDetails: scorecard.orderDetails,
    status: scorecard.status,
    lastUpdatedAt: scorecard.lastUpdatedAt,
    lastUpdatedBy: scorecard.lastUpdatedBy?.displayName || null,
    gateReviews: scorecard.gateReviews.map((gr) => ({
      id: gr.id,
      gateNumber: gr.gateNumber,
      planDate: gr.planDate,
      actualDate: gr.actualDate,
      outcome: gr.outcome,
    })),
    serviceLines: scorecard.serviceLineStatuses.map((sls) => ({
      id: sls.id,
      serviceLineId: sls.serviceLineId,
      name: sls.serviceLine.name,
      category: sls.serviceLine.category,
      guidanceText: sls.serviceLine.guidanceText,
      ragStatus: sls.ragStatus,
      statusText: sls.statusText,
      comments: sls.comments,
      updatedAt: sls.updatedAt,
    })),
  };
}

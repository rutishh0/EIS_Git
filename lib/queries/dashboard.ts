import { prisma } from "@/lib/db";
import type { RagStatus } from "@/lib/generated/prisma/client";

export async function getDashboardStats() {
  const [
    totalActive,
    atRisk,
    approachingEis,
    overdueScorecards,
  ] = await Promise.all([
    prisma.scorecard.count({
      where: { status: "ACTIVE" },
    }),
    prisma.scorecard.count({
      where: {
        status: "ACTIVE",
        serviceLineStatuses: {
          some: { ragStatus: "R" },
        },
      },
    }),
    prisma.scorecard.count({
      where: {
        status: "ACTIVE",
        eisDate: {
          lte: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
    prisma.scorecard.count({
      where: {
        status: "ACTIVE",
        lastUpdatedAt: {
          lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return { totalActive, atRisk, approachingEis, overdueScorecards };
}

export async function getPortfolioOverview() {
  const scorecards = await prisma.scorecard.findMany({
    where: { status: { not: "CLOSED" } },
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      serviceLineStatuses: { select: { ragStatus: true } },
      gateReviews: { orderBy: { gateNumber: "asc" } },
    },
    orderBy: { eisDate: "asc" },
  });

  return scorecards.map((sc) => ({
    id: sc.id,
    airlineId: sc.airlineId,
    customer: sc.airline.name,
    engineType: sc.engineType,
    region: sc.airline.region,
    eisLead: sc.eisLead?.displayName || "TBC",
    eisDate: sc.eisDate,
    eisDateTbc: sc.eisDateTbc,
    eisRisk: sc.eisRisk,
    status: sc.status,
    lastUpdatedAt: sc.lastUpdatedAt,
    ragStatuses: sc.serviceLineStatuses.map((s) => s.ragStatus) as RagStatus[],
    gateReviews: sc.gateReviews.map((gr) => ({
      gateNumber: gr.gateNumber,
      planDate: gr.planDate,
      actualDate: gr.actualDate,
      outcome: gr.outcome,
    })),
  }));
}

export async function getSystemStatus() {
  const [activeCount, latestUpdate] = await Promise.all([
    prisma.scorecard.count({ where: { status: "ACTIVE" } }),
    prisma.scorecard.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { lastUpdatedAt: "desc" },
      select: { lastUpdatedAt: true },
    }),
  ]);

  return {
    activePrograms: activeCount,
    lastSync: latestUpdate?.lastUpdatedAt || null,
  };
}

export async function getHeatmapData() {
  const scorecards = await prisma.scorecard.findMany({
    where: { status: "ACTIVE" },
    include: {
      airline: true,
      serviceLineStatuses: {
        include: { serviceLine: true },
        orderBy: { serviceLine: { sortOrder: "asc" } },
      },
    },
    orderBy: { eisDate: "asc" },
  });

  const serviceLines = await prisma.serviceLine.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return {
    airlines: scorecards.map((sc) => ({
      id: sc.airlineId,
      name: sc.airline.name,
      statuses: sc.serviceLineStatuses.reduce(
        (acc, sls) => {
          acc[sls.serviceLineId] = sls.ragStatus as RagStatus;
          return acc;
        },
        {} as Record<string, RagStatus>
      ),
    })),
    serviceLines: serviceLines.map((sl) => ({
      id: sl.id,
      name: sl.name,
      shortName: sl.name
        .replace("CONTRACTS - ", "")
        .replace("CUSTOMER ", "")
        .replace("NON-DEDICATED SPARE ENGINE SERVICE (NDSES)", "NDSES")
        .replace("PARTS AVAILABILITY SERVICE (PAS)", "PAS")
        .replace(" MANAGEMENT", " MGMT"),
      category: sl.category,
    })),
  };
}

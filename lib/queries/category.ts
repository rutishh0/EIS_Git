import { prisma } from "@/lib/db";
import type { RagStatus } from "@/lib/generated/prisma/client";

export interface FilterParams {
  regions?: string[];
  engines?: string[];
  eisFrom?: string | null;
  eisTo?: string | null;
  ragStatuses?: string[];
}

export interface CategoryRow {
  airlineId: string;
  airlineName: string;
  engineType: string;
  eisDate: string | null;
  eisDateTbc: boolean;
  eisLeadName: string | null;
  region: string;
  scorecardId: string;
  serviceLines: {
    id: string;
    serviceLineId: string;
    serviceLineName: string;
    ragStatus: string;
    statusText: string | null;
    comments: string | null;
    isDisputed: boolean;
  }[];
}

export async function getCategoryData(
  categoryServiceLines: string[],
  filters?: FilterParams,
): Promise<CategoryRow[]> {
  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (filters?.regions && filters.regions.length > 0) {
    where.airline = {
      ...(where.airline as Record<string, unknown> | undefined),
      region: { in: filters.regions },
    };
  }

  if (filters?.engines && filters.engines.length > 0) {
    where.engineType = { in: filters.engines };
  }

  if (filters?.eisFrom || filters?.eisTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.eisFrom) dateFilter.gte = new Date(filters.eisFrom);
    if (filters.eisTo) dateFilter.lte = new Date(filters.eisTo);
    where.eisDate = dateFilter;
  }

  const scorecards = await prisma.scorecard.findMany({
    where,
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      serviceLineStatuses: {
        where: {
          serviceLine: { name: { in: categoryServiceLines } },
        },
        include: { serviceLine: true },
        orderBy: { serviceLine: { sortOrder: "asc" } },
      },
    },
    orderBy: { airline: { name: "asc" } },
  });

  let results = scorecards.map((sc) => ({
    airlineId: sc.airlineId,
    airlineName: sc.airline.name,
    engineType: sc.engineType,
    eisDate: sc.eisDate ? sc.eisDate.toISOString() : null,
    eisDateTbc: sc.eisDateTbc,
    eisLeadName: sc.eisLead?.displayName ?? null,
    region: sc.airline.region,
    scorecardId: sc.id,
    serviceLines: sc.serviceLineStatuses.map((sls) => ({
      id: sls.id,
      serviceLineId: sls.serviceLineId,
      serviceLineName: sls.serviceLine.name,
      ragStatus: sls.ragStatus,
      statusText: sls.statusText,
      comments: sls.comments,
      isDisputed: sls.isDisputed,
    })),
  }));

  if (filters?.ragStatuses && filters.ragStatuses.length > 0) {
    const allowed = new Set(filters.ragStatuses);
    results = results.filter((row) =>
      row.serviceLines.some((sl) => allowed.has(sl.ragStatus)),
    );
  }

  return results;
}

export async function getOffPlanPrograms() {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const scorecards = await prisma.scorecard.findMany({
    where: {
      status: "ACTIVE",
      eisDate: { lte: sixMonthsFromNow },
      serviceLineStatuses: {
        some: { ragStatus: "R" as RagStatus },
      },
    },
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      serviceLineStatuses: {
        where: { ragStatus: "R" as RagStatus },
        include: { serviceLine: true },
        orderBy: { serviceLine: { sortOrder: "asc" } },
      },
    },
    orderBy: { eisDate: "asc" },
  });

  return scorecards.map((sc) => ({
    airlineId: sc.airlineId,
    airlineName: sc.airline.name,
    engineType: sc.engineType,
    eisDate: sc.eisDate ? sc.eisDate.toISOString() : null,
    eisLeadName: sc.eisLead?.displayName ?? null,
    scorecardId: sc.id,
    redServiceLines: sc.serviceLineStatuses.map((sls) => ({
      id: sls.id,
      serviceLineName: sls.serviceLine.name,
      statusText: sls.statusText,
      comments: sls.comments,
    })),
  }));
}

export async function getPastEISPrograms() {
  const now = new Date();

  const scorecards = await prisma.scorecard.findMany({
    where: {
      OR: [{ eisDate: { lt: now } }, { status: "CLOSED" }],
    },
    include: {
      airline: true,
      eisLead: { select: { displayName: true } },
      serviceLineStatuses: {
        include: { serviceLine: true },
        orderBy: { serviceLine: { sortOrder: "asc" } },
      },
    },
    orderBy: { eisDate: "desc" },
  });

  return scorecards.map((sc) => ({
    airlineId: sc.airlineId,
    airlineName: sc.airline.name,
    engineType: sc.engineType,
    eisDate: sc.eisDate ? sc.eisDate.toISOString() : null,
    eisLeadName: sc.eisLead?.displayName ?? null,
    status: sc.status,
    scorecardId: sc.id,
    serviceLines: sc.serviceLineStatuses.map((sls) => ({
      id: sls.id,
      serviceLineId: sls.serviceLineId,
      serviceLineName: sls.serviceLine.name,
      ragStatus: sls.ragStatus,
      statusText: sls.statusText,
      comments: sls.comments,
      isDisputed: sls.isDisputed,
    })),
  }));
}

export async function getRecentComments(limit: number = 10) {
  const statuses = await prisma.serviceLineStatus.findMany({
    where: {
      comments: { not: null },
    },
    include: {
      serviceLine: true,
      scorecard: {
        include: { airline: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return statuses.map((sls) => ({
    airlineId: sls.scorecard.airlineId,
    airlineName: sls.scorecard.airline.name,
    serviceLineName: sls.serviceLine.name,
    ragStatus: sls.ragStatus,
    statusText: sls.statusText,
    comments: sls.comments,
    updatedAt: sls.updatedAt.toISOString(),
  }));
}

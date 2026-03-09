import { prisma } from "@/lib/db";

interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  scorecardId?: string;
  search?: string;
}

export async function getAuditLogs({
  page = 1,
  pageSize = 50,
  userId,
  scorecardId,
  search,
}: AuditLogFilters = {}) {
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (scorecardId) where.scorecardId = scorecardId;
  if (search) {
    where.OR = [
      { fieldChanged: { contains: search, mode: "insensitive" } },
      { oldValue: { contains: search, mode: "insensitive" } },
      { newValue: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { displayName: true } },
        scorecard: {
          include: { airline: { select: { name: true } } },
        },
      },
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      user: log.user.displayName,
      airline: log.scorecard?.airline?.name || "—",
      action: log.action,
      fieldChanged: log.fieldChanged,
      oldValue: log.oldValue,
      newValue: log.newValue,
      changedAt: log.changedAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

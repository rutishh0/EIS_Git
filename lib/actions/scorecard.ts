import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function logAudit(
  userId: string,
  scorecardId: string,
  action: string,
  fieldChanged?: string,
  oldValue?: string | null,
  newValue?: string | null
) {
  await prisma.auditLog.create({
    data: {
      userId,
      scorecardId,
      action,
      fieldChanged,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
    },
  });
}

export async function updateScorecardHeader(
  scorecardId: string,
  data: {
    eisDate?: string | null;
    eisDateTbc?: boolean;
    eisRisk?: string;
    orderDetails?: string | null;
    status?: string;
  }
) {
  const user = await getAuthenticatedUser();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new Error("Forbidden");
  }

  const existing = await prisma.scorecard.findUnique({
    where: { id: scorecardId },
  });
  if (!existing) throw new Error("Scorecard not found");

  const updateData: Record<string, unknown> = {
    lastUpdatedAt: new Date(),
    lastUpdatedById: user.id,
  };

  if (data.eisDate !== undefined) {
    const oldVal = existing.eisDate?.toISOString() || null;
    const newVal = data.eisDate;
    updateData.eisDate = data.eisDate ? new Date(data.eisDate) : null;
    await logAudit(user.id, scorecardId, "UPDATE", "eisDate", oldVal, newVal);
  }

  if (data.eisDateTbc !== undefined) {
    updateData.eisDateTbc = data.eisDateTbc;
    await logAudit(user.id, scorecardId, "UPDATE", "eisDateTbc", String(existing.eisDateTbc), String(data.eisDateTbc));
  }

  if (data.eisRisk !== undefined) {
    updateData.eisRisk = data.eisRisk;
    await logAudit(user.id, scorecardId, "UPDATE", "eisRisk", existing.eisRisk, data.eisRisk);
  }

  if (data.orderDetails !== undefined) {
    updateData.orderDetails = data.orderDetails;
    await logAudit(user.id, scorecardId, "UPDATE", "orderDetails", existing.orderDetails, data.orderDetails);
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
    await logAudit(user.id, scorecardId, "UPDATE", "status", existing.status, data.status);
  }

  return prisma.scorecard.update({
    where: { id: scorecardId },
    data: updateData,
  });
}

export async function updateServiceLineStatus(
  serviceLineStatusId: string,
  data: {
    ragStatus?: string;
    statusText?: string | null;
    comments?: string | null;
  }
) {
  const user = await getAuthenticatedUser();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new Error("Forbidden");
  }

  const existing = await prisma.serviceLineStatus.findUnique({
    where: { id: serviceLineStatusId },
    include: { serviceLine: true },
  });
  if (!existing) throw new Error("Service line status not found");

  const updateData: Record<string, unknown> = {};

  if (data.ragStatus !== undefined) {
    updateData.ragStatus = data.ragStatus;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `${existing.serviceLine.name}.ragStatus`,
      existing.ragStatus,
      data.ragStatus
    );
  }

  if (data.statusText !== undefined) {
    updateData.statusText = data.statusText;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `${existing.serviceLine.name}.statusText`,
      existing.statusText,
      data.statusText
    );
  }

  if (data.comments !== undefined) {
    updateData.comments = data.comments;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `${existing.serviceLine.name}.comments`,
      existing.comments,
      data.comments
    );
  }

  // Also update the scorecard's lastUpdatedAt
  await prisma.scorecard.update({
    where: { id: existing.scorecardId },
    data: {
      lastUpdatedAt: new Date(),
      lastUpdatedById: user.id,
    },
  });

  return prisma.serviceLineStatus.update({
    where: { id: serviceLineStatusId },
    data: updateData,
  });
}

export async function updateGateReview(
  gateReviewId: string,
  data: {
    planDate?: string | null;
    actualDate?: string | null;
    outcome?: string | null;
  }
) {
  const user = await getAuthenticatedUser();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new Error("Forbidden");
  }

  const existing = await prisma.gateReview.findUnique({
    where: { id: gateReviewId },
  });
  if (!existing) throw new Error("Gate review not found");

  const updateData: Record<string, unknown> = {};

  if (data.planDate !== undefined) {
    updateData.planDate = data.planDate ? new Date(data.planDate) : null;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `Gate ${existing.gateNumber}.planDate`,
      existing.planDate?.toISOString() || null,
      data.planDate
    );
  }

  if (data.actualDate !== undefined) {
    updateData.actualDate = data.actualDate ? new Date(data.actualDate) : null;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `Gate ${existing.gateNumber}.actualDate`,
      existing.actualDate?.toISOString() || null,
      data.actualDate
    );
  }

  if (data.outcome !== undefined) {
    updateData.outcome = data.outcome;
    await logAudit(
      user.id,
      existing.scorecardId,
      "UPDATE",
      `Gate ${existing.gateNumber}.outcome`,
      existing.outcome,
      data.outcome
    );
  }

  await prisma.scorecard.update({
    where: { id: existing.scorecardId },
    data: {
      lastUpdatedAt: new Date(),
      lastUpdatedById: user.id,
    },
  });

  return prisma.gateReview.update({
    where: { id: gateReviewId },
    data: updateData,
  });
}

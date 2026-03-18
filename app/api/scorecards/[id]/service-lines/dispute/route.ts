import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _scorecardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceLineStatusId, note } = await request.json();

    if (!serviceLineStatusId || !note) {
      return NextResponse.json(
        { error: "serviceLineStatusId and note are required" },
        { status: 400 }
      );
    }

    const sls = await prisma.serviceLineStatus.findUnique({
      where: { id: serviceLineStatusId },
      include: {
        scorecard: { include: { airline: true } },
        serviceLine: true,
      },
    });

    if (!sls || sls.scorecardId !== _scorecardId) {
      return NextResponse.json(
        { error: "Service line status not found for this scorecard" },
        { status: 404 }
      );
    }

    const updated = await prisma.serviceLineStatus.update({
      where: { id: serviceLineStatusId },
      data: {
        isDisputed: true,
        disputeNote: note,
        disputedAt: new Date(),
        disputedById: session.user.id,
      },
    });

    const notificationRecipients: string[] = [];

    if (sls.scorecard.eisLeadId && sls.scorecard.eisLeadId !== session.user.id) {
      notificationRecipients.push(sls.scorecard.eisLeadId);
    }

    const admins = await prisma.user.findMany({
      where: { isActive: true, role: "ADMIN", id: { notIn: [session.user.id] } },
      select: { id: true },
    });
    for (const admin of admins) {
      if (!notificationRecipients.includes(admin.id)) {
        notificationRecipients.push(admin.id);
      }
    }

    for (const userId of notificationRecipients) {
      await prisma.notification.create({
        data: {
          userId,
          type: "DISPUTE_RAISED",
          title: `Dispute: ${sls.scorecard.airline.name} – ${sls.serviceLine.name}`,
          message: `A dispute has been raised on ${sls.serviceLine.name} for ${sls.scorecard.airline.name}. Note: ${note}`,
          scorecardId: sls.scorecardId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        scorecardId: sls.scorecardId,
        action: "DISPUTE_RAISED",
        fieldChanged: `serviceLineStatus:${sls.serviceLine.name}`,
        oldValue: sls.ragStatus,
        newValue: `disputed – ${note}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scorecardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      const scorecard = await prisma.scorecard.findUnique({
        where: { id: scorecardId },
        select: { eisLeadId: true },
      });
      if (!scorecard || scorecard.eisLeadId !== session.user.id) {
        return NextResponse.json(
          { error: "Only admins or EIS lead can resolve disputes" },
          { status: 403 }
        );
      }
    }

    const { serviceLineStatusId, resolution, newRagStatus } =
      await request.json();

    if (!serviceLineStatusId || !resolution) {
      return NextResponse.json(
        { error: "serviceLineStatusId and resolution are required" },
        { status: 400 }
      );
    }

    if (resolution !== "confirmed" && resolution !== "overridden") {
      return NextResponse.json(
        { error: 'resolution must be "confirmed" or "overridden"' },
        { status: 400 }
      );
    }

    if (resolution === "overridden" && !newRagStatus) {
      return NextResponse.json(
        { error: "newRagStatus is required when overriding" },
        { status: 400 }
      );
    }

    const sls = await prisma.serviceLineStatus.findUnique({
      where: { id: serviceLineStatusId },
      include: {
        scorecard: { include: { airline: true } },
        serviceLine: true,
      },
    });

    if (!sls || sls.scorecardId !== scorecardId) {
      return NextResponse.json(
        { error: "Service line status not found for this scorecard" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      isDisputed: false,
      disputeNote: null,
      disputedAt: null,
      disputedById: null,
    };

    if (resolution === "overridden") {
      updateData.ragStatus = newRagStatus;
    }

    const updated = await prisma.serviceLineStatus.update({
      where: { id: serviceLineStatusId },
      data: updateData,
    });

    if (sls.disputedById) {
      await prisma.notification.create({
        data: {
          userId: sls.disputedById,
          type: "DISPUTE_RESOLVED",
          title: `Dispute Resolved: ${sls.scorecard.airline.name} – ${sls.serviceLine.name}`,
          message:
            resolution === "confirmed"
              ? `Your dispute on ${sls.serviceLine.name} for ${sls.scorecard.airline.name} was reviewed. The current status has been confirmed.`
              : `Your dispute on ${sls.serviceLine.name} for ${sls.scorecard.airline.name} was reviewed. The status has been changed to ${newRagStatus}.`,
          scorecardId: sls.scorecardId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        scorecardId: sls.scorecardId,
        action: "DISPUTE_RESOLVED",
        fieldChanged: `serviceLineStatus:${sls.serviceLine.name}`,
        oldValue: `disputed (${sls.ragStatus})`,
        newValue:
          resolution === "confirmed"
            ? `confirmed (${sls.ragStatus})`
            : `overridden to ${newRagStatus}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

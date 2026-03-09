import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMonths } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, region, engineType, eisDate, eisDateTbc, eisRisk, eisLeadId, orderDetails } = body;

    if (!name || !region || !engineType) {
      return NextResponse.json(
        { error: "name, region, and engineType are required" },
        { status: 400 }
      );
    }

    // Check for duplicate airline
    const existing = await prisma.airline.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Airline already exists" },
        { status: 409 }
      );
    }

    // Get all service lines for auto-creation
    const serviceLines = await prisma.serviceLine.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const parsedEisDate = eisDate && !eisDateTbc ? new Date(eisDate) : null;

    // Create airline + scorecard + gate reviews + service line statuses in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const airline = await tx.airline.create({
        data: {
          name,
          region,
        },
      });

      const scorecard = await tx.scorecard.create({
        data: {
          airlineId: airline.id,
          engineType,
          eisDate: parsedEisDate,
          eisDateTbc: !!eisDateTbc,
          eisRisk: eisRisk || "NO_RISK",
          eisLeadId: eisLeadId || null,
          orderDetails: orderDetails || null,
          status: "ACTIVE",
          lastUpdatedById: session.user.id,
        },
      });

      // Create 6 gate reviews with auto-calculated plan dates
      const gateOffsets = [-24, -18, -12, -6, -3, 2]; // months relative to EIS
      for (let i = 0; i < 6; i++) {
        await tx.gateReview.create({
          data: {
            scorecardId: scorecard.id,
            gateNumber: i + 1,
            planDate: parsedEisDate
              ? addMonths(parsedEisDate, gateOffsets[i])
              : null,
          },
        });
      }

      // Create 23 service line statuses (all defaulting to G)
      for (const sl of serviceLines) {
        await tx.serviceLineStatus.create({
          data: {
            scorecardId: scorecard.id,
            serviceLineId: sl.id,
            ragStatus: "G",
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          scorecardId: scorecard.id,
          action: "CREATE",
          fieldChanged: "airline",
          newValue: name,
        },
      });

      return { airline, scorecard };
    });

    return NextResponse.json(
      { airlineId: result.airline.id, scorecardId: result.scorecard.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

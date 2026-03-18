import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { corsHeaders } from "../../cors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ airlineId: string }> }
) {
  try {
    const auth = await authenticateMobileRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { airlineId } = await params;

    // Support lookup by airlineId or scorecardId
    const scorecard = await prisma.scorecard.findFirst({
      where: {
        OR: [{ airlineId }, { id: airlineId }],
      },
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

    if (!scorecard) {
      return NextResponse.json(
        { error: "Scorecard not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        id: scorecard.id,
        airlineId: scorecard.airlineId,
        airlineName: scorecard.airline.name,
        region: scorecard.airline.region,
        engineType: scorecard.engineType,
        eisDate: scorecard.eisDate,
        eisDateTbc: scorecard.eisDateTbc,
        eisRisk: scorecard.eisRisk,
        eisLeadName: scorecard.eisLead?.displayName ?? null,
        orderDetails: scorecard.orderDetails,
        status: scorecard.status,
        lastUpdatedAt: scorecard.lastUpdatedAt,
        gateReviews: scorecard.gateReviews.map((gr) => ({
          gateNumber: gr.gateNumber,
          planDate: gr.planDate,
          actualDate: gr.actualDate,
          outcome: gr.outcome,
        })),
        serviceLineStatuses: scorecard.serviceLineStatuses.map((sls) => ({
          id: sls.id,
          serviceLineName: sls.serviceLine.name,
          serviceLineCategory: sls.serviceLine.category,
          ragStatus: sls.ragStatus,
          statusText: sls.statusText,
          comments: sls.comments,
          isDisputed: sls.isDisputed,
          disputeNote: sls.disputeNote,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import type { RagStatus } from "@/lib/generated/prisma/client";
import { corsHeaders } from "../cors";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateMobileRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const scorecards = await prisma.scorecard.findMany({
      where: { status: { not: "CLOSED" } },
      include: {
        airline: true,
        eisLead: { select: { displayName: true } },
        serviceLineStatuses: { select: { ragStatus: true } },
      },
      orderBy: { eisDate: "asc" },
    });

    const portfolio = scorecards.map((sc) => {
      const statuses = sc.serviceLineStatuses.map((s) => s.ragStatus) as RagStatus[];
      const redCount = statuses.filter((s) => s === "R").length;
      const amberCount = statuses.filter((s) => s === "A").length;
      const greenCount = statuses.filter((s) => s === "G").length;
      const completeCount = statuses.filter((s) => s === "C").length;

      let overallRag: string = "G";
      if (redCount > 0) overallRag = "R";
      else if (amberCount > 0) overallRag = "A";
      else if (statuses.every((s) => s === "C" || s === "NA")) overallRag = "C";

      return {
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
        overallRag,
        redCount,
        amberCount,
        greenCount,
        completeCount,
      };
    });

    return NextResponse.json(portfolio, { headers: corsHeaders });
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

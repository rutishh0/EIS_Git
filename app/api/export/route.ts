import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";
    const airlineId = searchParams.get("airlineId");
    const region = searchParams.get("region");

    const whereClause: Record<string, unknown> = {};
    if (airlineId) {
      whereClause.airlineId = airlineId;
    } else {
      whereClause.status = { not: "CLOSED" };
    }
    if (region) {
      whereClause.airline = { region: region.toUpperCase().replace(/ /g, "_") };
    }

    const scorecards = await prisma.scorecard.findMany({
      where: whereClause,
      include: {
        airline: true,
        eisLead: { select: { displayName: true } },
        gateReviews: { orderBy: { gateNumber: "asc" } },
        serviceLineStatuses: {
          include: { serviceLine: true },
          orderBy: { serviceLine: { sortOrder: "asc" } },
        },
      },
      orderBy: { airline: { name: "asc" } },
    });

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();

      // Overview sheet
      const overviewData = scorecards.map((sc) => {
        const ragStatuses = sc.serviceLineStatuses.map((s) => s.ragStatus);
        let overallRag = "G";
        if (ragStatuses.includes("R")) overallRag = "R";
        else if (ragStatuses.includes("A")) overallRag = "A";
        else if (ragStatuses.every((s) => s === "C" || s === "NA")) overallRag = "C";

        return {
          Customer: sc.airline.name,
          Region: sc.airline.region,
          "Engine Type": sc.engineType,
          "EIS Lead": sc.eisLead?.displayName || "TBC",
          "EIS Date": sc.eisDate ? sc.eisDate.toISOString().split("T")[0] : sc.eisDateTbc ? "TBC" : "",
          "EIS Risk": sc.eisRisk.replace("_", " "),
          Status: sc.status,
          "Overall RAG": overallRag,
          "Last Updated": sc.lastUpdatedAt.toISOString().split("T")[0],
        };
      });

      const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewSheet, "Overview");

      // Service Line Detail sheet
      const slData: Record<string, unknown>[] = [];
      for (const sc of scorecards) {
        for (const sls of sc.serviceLineStatuses) {
          slData.push({
            Customer: sc.airline.name,
            "Service Line": sls.serviceLine.name,
            Category: sls.serviceLine.category,
            "RAG Status": sls.ragStatus,
            "Status Text": sls.statusText || "",
            Comments: sls.comments || "",
          });
        }
      }
      const slSheet = XLSX.utils.json_to_sheet(slData);
      XLSX.utils.book_append_sheet(wb, slSheet, "Service Lines");

      // Gate Reviews sheet
      const gateData: Record<string, unknown>[] = [];
      for (const sc of scorecards) {
        for (const gr of sc.gateReviews) {
          gateData.push({
            Customer: sc.airline.name,
            Gate: `Gate ${gr.gateNumber}`,
            "Plan Date": gr.planDate ? gr.planDate.toISOString().split("T")[0] : "",
            "Actual Date": gr.actualDate ? gr.actualDate.toISOString().split("T")[0] : "",
            Outcome: gr.outcome || "",
          });
        }
      }
      const gateSheet = XLSX.utils.json_to_sheet(gateData);
      XLSX.utils.book_append_sheet(wb, gateSheet, "Gate Reviews");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const filename = airlineId
        ? `eis-scorecard-${scorecards[0]?.airline.name || "export"}.xlsx`
        : "eis-portfolio-export.xlsx";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON fallback
    return NextResponse.json(scorecards);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

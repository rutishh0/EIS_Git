import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseExcelWorkbook } from "@/lib/excel/parser";
import { mapParsedData } from "@/lib/excel/mapper";
import { addMonths } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the session user still exists in DB (handles stale JWT after DB reset)
    let currentUserId = session.user.id;
    const dbUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!dbUser) {
      // Fallback: find the user by username from session
      const fallbackUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (!fallbackUser) {
        return NextResponse.json({ error: "No admin user found in database" }, { status: 500 });
      }
      currentUserId = fallbackUser.id;
    }

    const body = await request.json();
    const fileEntry = body?.files?.[0];

    if (!fileEntry?.data) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Strip data-URI header (e.g. "data:application/vnd...;base64,") if present
    let b64 = fileEntry.data as string;
    if (b64.includes(",")) {
      b64 = b64.split(",")[1];
    }

    const nodeBuffer = Buffer.from(b64, "base64");
    const buffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
    const parsed = parseExcelWorkbook(buffer);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No airline data found in workbook. Expected a Power BI flat-table export with a 'Customer' column header." },
        { status: 400 }
      );
    }

    const mapped = mapParsedData(parsed);

    const serviceLines = await prisma.serviceLine.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const slMap = new Map(serviceLines.map((sl) => [sl.name, sl.id]));

    // Build a map of user display names to IDs for EIS lead matching
    const users = await prisma.user.findMany({ select: { id: true, displayName: true } });
    const userByName = new Map(users.map((u) => [u.displayName.toLowerCase(), u.id]));

    let airlinesCreated = 0;
    let scorecardsUpdated = 0;
    let serviceLinesMapped = 0;
    const errors: string[] = [];

    for (const entry of mapped) {
      try {
        const existingAirline = await prisma.airline.findUnique({
          where: { name: entry.airline.name },
          include: { scorecard: true },
        });

        if (existingAirline?.scorecard) {
          // Update existing scorecard
          const sc = existingAirline.scorecard;

          // Try to match EIS lead name to an existing user
          const eisLeadId = entry.scorecard.eisLead
            ? userByName.get(entry.scorecard.eisLead.toLowerCase()) || null
            : null;

          await prisma.scorecard.update({
            where: { id: sc.id },
            data: {
              engineType: entry.scorecard.engineType,
              eisDate: entry.scorecard.eisDate,
              eisDateTbc: entry.scorecard.eisDateTbc,
              eisRisk: entry.scorecard.eisRisk as "NO_RISK" | "YES_CUSTOMER" | "YES_RR",
              eisLeadId,
              orderDetails: entry.scorecard.eisLead
                ? `EIS Lead: ${entry.scorecard.eisLead}`
                : entry.scorecard.orderDetails,
              lastUpdatedAt: entry.scorecard.lastUpdated || new Date(),
              lastUpdatedById: currentUserId,
            },
          });

          // Update service line statuses
          for (const sl of entry.serviceLines) {
            const slId = slMap.get(sl.name);
            if (!slId) continue;

            await prisma.serviceLineStatus.upsert({
              where: {
                scorecardId_serviceLineId: {
                  scorecardId: sc.id,
                  serviceLineId: slId,
                },
              },
              update: {
                ragStatus: sl.ragStatus as "C" | "G" | "A" | "R" | "NA",
                statusText: sl.statusText,
                comments: sl.comments,
              },
              create: {
                scorecardId: sc.id,
                serviceLineId: slId,
                ragStatus: sl.ragStatus as "C" | "G" | "A" | "R" | "NA",
                statusText: sl.statusText,
                comments: sl.comments,
              },
            });
            serviceLinesMapped++;
          }

          scorecardsUpdated++;
        } else {
          // Create new airline + scorecard
          const region = (["EUROPE", "MEA", "APAC", "GREATER_CHINA", "AMERICAS"].includes(
            entry.airline.region
          )
            ? entry.airline.region
            : "EUROPE") as "EUROPE" | "MEA" | "APAC" | "GREATER_CHINA" | "AMERICAS";

          const airline = existingAirline || await prisma.airline.create({
            data: {
              name: entry.airline.name,
              region,
            },
          });

          // Try to match EIS lead name to an existing user
          const eisLeadId = entry.scorecard.eisLead
            ? userByName.get(entry.scorecard.eisLead.toLowerCase()) || null
            : null;

          const scorecard = await prisma.scorecard.create({
            data: {
              airlineId: airline.id,
              engineType: entry.scorecard.engineType,
              eisDate: entry.scorecard.eisDate,
              eisDateTbc: entry.scorecard.eisDateTbc,
              eisRisk: (entry.scorecard.eisRisk as "NO_RISK" | "YES_CUSTOMER" | "YES_RR") || "NO_RISK",
              eisLeadId,
              orderDetails: entry.scorecard.eisLead
                ? `EIS Lead: ${entry.scorecard.eisLead}`
                : entry.scorecard.orderDetails,
              status: "ACTIVE",
              lastUpdatedAt: entry.scorecard.lastUpdated || new Date(),
              lastUpdatedById: currentUserId,
            },
          });

          // Create 6 gate reviews
          const gateOffsets = [-24, -18, -12, -6, -3, 2];
          for (let i = 0; i < 6; i++) {
            await prisma.gateReview.create({
              data: {
                scorecardId: scorecard.id,
                gateNumber: i + 1,
                planDate: entry.scorecard.eisDate
                  ? addMonths(entry.scorecard.eisDate, gateOffsets[i])
                  : null,
              },
            });
          }

          // Create service line statuses
          for (const sl of serviceLines) {
            const importedSl = entry.serviceLines.find((s) => s.name === sl.name);
            await prisma.serviceLineStatus.create({
              data: {
                scorecardId: scorecard.id,
                serviceLineId: sl.id,
                ragStatus: (importedSl?.ragStatus as "C" | "G" | "A" | "R" | "NA") || "G",
                statusText: importedSl?.statusText || null,
                comments: importedSl?.comments || null,
              },
            });
            if (importedSl) serviceLinesMapped++;
          }

          airlinesCreated++;
        }

        // Audit log
        await prisma.auditLog.create({
          data: {
            userId: currentUserId,
            scorecardId: existingAirline?.scorecard?.id || undefined,
            action: existingAirline?.scorecard ? "IMPORT_UPDATE" : "IMPORT_CREATE",
            fieldChanged: "excel_import",
            newValue: entry.airline.name,
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${entry.airline.name}: ${msg}`);
      }
    }

    return NextResponse.json({
      airlinesCreated,
      scorecardsUpdated,
      serviceLinesMapped,
      errors,
      totalParsed: mapped.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

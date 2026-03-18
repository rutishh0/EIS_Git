import { prisma } from "@/lib/db";
import { addMonths, differenceInDays, isBefore } from "date-fns";

export async function generateNotifications() {
  const now = new Date();
  const results = { created: 0, skipped: 0 };

  const scorecards = await prisma.scorecard.findMany({
    where: { status: "ACTIVE" },
    include: {
      airline: true,
      eisLead: true,
      serviceLineStatuses: true,
    },
  });

  const adminEditors = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["ADMIN", "EDITOR"] } },
    select: { id: true },
  });

  for (const sc of scorecards) {
    const fallbackIds = adminEditors.map((u) => u.id);
    const hasLead = sc.eisLeadId && sc.eisLead;

    function getRecipientIds(): string[] {
      if (hasLead) {
        return [sc.eisLeadId!];
      }
      return fallbackIds;
    }

    // --- EIS_APPROACHING: 12, 9, 6, 3 month thresholds ---
    if (sc.eisDate) {
      const thresholds = [12, 9, 6, 3];
      for (const months of thresholds) {
        const thresholdDate = addMonths(now, months);
        if (isBefore(sc.eisDate, thresholdDate)) {
          const daysUntil = differenceInDays(sc.eisDate, now);
          if (daysUntil > 0) {
            const title = `EIS in ${months} months: ${sc.airline.name}`;
            const existing = await prisma.notification.findFirst({
              where: {
                scorecardId: sc.id,
                type: "EIS_APPROACHING",
                title,
                createdAt: { gte: addMonths(now, -1) },
              },
            });
            if (!existing) {
              for (const userId of getRecipientIds()) {
                await prisma.notification.create({
                  data: {
                    userId,
                    type: "EIS_APPROACHING",
                    title,
                    message: `${sc.airline.name} EIS date is ${daysUntil} days away (${sc.engineType}).`,
                    scorecardId: sc.id,
                  },
                });
                results.created++;
              }
            } else {
              results.skipped++;
            }
            break;
          }
        }
      }
    }

    // --- SCORECARD_OVERDUE: not updated in 30+ days ---
    const daysSinceUpdate = differenceInDays(now, sc.lastUpdatedAt);
    if (daysSinceUpdate > 30) {
      const title = `Overdue: ${sc.airline.name}`;
      const existing = await prisma.notification.findFirst({
        where: {
          scorecardId: sc.id,
          type: "SCORECARD_OVERDUE",
          title,
          createdAt: { gte: addMonths(now, -1) },
        },
      });
      if (!existing) {
        for (const userId of getRecipientIds()) {
          await prisma.notification.create({
            data: {
              userId,
              type: "SCORECARD_OVERDUE",
              title,
              message: `${sc.airline.name} scorecard has not been updated in ${daysSinceUpdate} days.`,
              scorecardId: sc.id,
            },
          });
          results.created++;
        }
      } else {
        results.skipped++;
      }
    }

    // --- OFF_PLAN: RED service lines with EIS within 180 days ---
    if (sc.eisDate) {
      const daysUntilEis = differenceInDays(sc.eisDate, now);
      const hasRedLines = sc.serviceLineStatuses.some(
        (sls) => sls.ragStatus === "R"
      );

      if (hasRedLines && daysUntilEis > 0 && daysUntilEis <= 180) {
        const title = `Off Plan: ${sc.airline.name}`;
        const existing = await prisma.notification.findFirst({
          where: {
            scorecardId: sc.id,
            type: "OFF_PLAN",
            title,
            createdAt: { gte: addMonths(now, -1) },
          },
        });
        if (!existing) {
          if (hasLead) {
            await prisma.notification.create({
              data: {
                userId: sc.eisLeadId!,
                type: "OFF_PLAN",
                title,
                message: `${sc.airline.name} has RED service lines with EIS in ${daysUntilEis} days.`,
                scorecardId: sc.id,
              },
            });
            results.created++;
          }
        } else {
          results.skipped++;
        }
      }
    }

    // --- PAST_EIS: eisDate has passed but scorecard still active ---
    if (sc.eisDate && isBefore(sc.eisDate, now)) {
      const title = `Past EIS: ${sc.airline.name}`;
      const existing = await prisma.notification.findFirst({
        where: {
          scorecardId: sc.id,
          type: "PAST_EIS",
          title,
          createdAt: { gte: addMonths(now, -1) },
        },
      });
      if (!existing) {
        if (hasLead) {
          await prisma.notification.create({
            data: {
              userId: sc.eisLeadId!,
              type: "PAST_EIS",
              title,
              message: `${sc.airline.name} has passed its EIS date. Please update or close the scorecard.`,
              scorecardId: sc.id,
            },
          });
          results.created++;
        }
      } else {
        results.skipped++;
      }
    }
  }

  return results;
}

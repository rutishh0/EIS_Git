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
      gateReviews: true,
    },
  });

  // Get all admins + editors for notifications
  const recipients = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["ADMIN", "EDITOR"] } },
    select: { id: true },
  });

  for (const sc of scorecards) {
    const recipientIds = recipients.map((r) => r.id);
    if (sc.eisLead && !recipientIds.includes(sc.eisLead.id)) {
      recipientIds.push(sc.eisLead.id);
    }

    // EIS Approaching: 12, 9, 6, 3 month thresholds
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
              for (const userId of recipientIds) {
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
            break; // Only send for the nearest threshold
          }
        }
      }
    }

    // Scorecard Overdue: not updated in 30+ days
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
        for (const userId of recipientIds) {
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

    // Gate Review Due: plan date within 30 days
    for (const gate of sc.gateReviews) {
      if (gate.planDate && !gate.actualDate) {
        const daysUntilGate = differenceInDays(gate.planDate, now);
        if (daysUntilGate >= 0 && daysUntilGate <= 30) {
          const title = `Gate ${gate.gateNumber} due: ${sc.airline.name}`;
          const existing = await prisma.notification.findFirst({
            where: {
              scorecardId: sc.id,
              type: "GATE_DUE",
              title,
              createdAt: { gte: addMonths(now, -1) },
            },
          });
          if (!existing) {
            for (const userId of recipientIds) {
              await prisma.notification.create({
                data: {
                  userId,
                  type: "GATE_DUE",
                  title,
                  message: `Gate ${gate.gateNumber} review for ${sc.airline.name} is due in ${daysUntilGate} days.`,
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
    }
  }

  return results;
}

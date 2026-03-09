import { PrismaClient, ServiceLineCategory } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Service line names MUST match exactly with the parser output.
 * These are derived from the Power BI export column headers.
 */
const standardServiceLines = [
  {
    name: "Product Agreement",
    sortOrder: 1,
    guidanceText: "Legally binding PA document. DEG reference for Product Agreement.",
  },
  {
    name: "TotalCare Agreement",
    sortOrder: 2,
    guidanceText: "TotalCare Agreement, service level offerings.",
  },
  {
    name: "IP Spares",
    sortOrder: 3,
    guidanceText: "Expendables, Rotables, Repairables provisioning. RSPL provided to customer.",
  },
  {
    name: "IP Tooling",
    sortOrder: 4,
    guidanceText: "Line Maintenance Tooling orders. 9-month lead time assumed for scoring.",
  },
  {
    name: "Spare Engine - Dedicated",
    sortOrder: 5,
    guidanceText: "Dedicated spare engines per Product Agreement. Includes tooling delivery.",
  },
  {
    name: "EHM",
    sortOrder: 6,
    guidanceText: "Engine Health Monitoring / Rolls-Royce Care trend monitoring setup.",
  },
  {
    name: "DACs/ Lifing Insight",
    sortOrder: 7,
    guidanceText: "Life Limited Parts monitoring and DACs briefing. MS5 Non Executive Operation readiness.",
  },
  {
    name: "Overhaul Services",
    sortOrder: 8,
    guidanceText: "Overhaul shop identification, audits, and approvals.",
  },
  {
    name: "Customer Training",
    sortOrder: 9,
    guidanceText: "Line and base maintenance training courses. Booking status relative to EIS date.",
  },
  {
    name: "Field Support",
    sortOrder: 10,
    guidanceText: "AST (Account Service Team) headcount and onboarding.",
  },
  {
    name: "Airline Facility Readiness",
    sortOrder: 11,
    guidanceText: "AMM task capability, tooling, approvals, and facilities.",
  },
];

const additionalServiceLines = [
  {
    name: "PAS",
    sortOrder: 12,
    guidanceText: "Parts Availability Service. Alternative to purchasing spare LRU/LRP parts.",
  },
  {
    name: "LRU Management",
    sortOrder: 13,
    guidanceText: "Line Replaceable Units repair/exchange management. Demand loaded into SORB.",
  },
  {
    name: "LRP Management",
    sortOrder: 14,
    guidanceText: "Line Replaceable Parts repair/replacement management.",
  },
  {
    name: "NDSES",
    sortOrder: 15,
    guidanceText: "Non-Dedicated Spare Engine Service. Lease engine pool service.",
  },
  {
    name: "Transportation - Routine",
    sortOrder: 16,
    guidanceText: "Engine transport between main base and overhaul shop.",
  },
  {
    name: "Transportation - Remote",
    sortOrder: 17,
    guidanceText: "Transport from remote site locations to overhaul shops.",
  },
  {
    name: "On-Wing Tech Support",
    sortOrder: 18,
    guidanceText: "OSD 24/7 troubleshooting support. On-wing technical support readiness.",
  },
  {
    name: "Engine Split",
    sortOrder: 19,
    guidanceText: "Trent XWB specific LP/Core split for air freight.",
  },
  {
    name: "Flight Ops",
    sortOrder: 20,
    guidanceText: "FOST pilot briefing and technical support for flight operations.",
  },
  {
    name: "Bespoke Service",
    sortOrder: 21,
    guidanceText: "Custom service line slot 1. Define as needed per airline contract.",
  },
  {
    name: "Bespoke Service 2",
    sortOrder: 22,
    guidanceText: "Custom service line slot 2. Define as needed per airline contract.",
  },
];

async function main() {
  console.log("Seeding service lines...");

  // Delete old service lines that no longer match
  const allOldSLs = await prisma.serviceLine.findMany();
  const newNames = new Set([
    ...standardServiceLines.map((sl) => sl.name),
    ...additionalServiceLines.map((sl) => sl.name),
  ]);
  for (const old of allOldSLs) {
    if (!newNames.has(old.name)) {
      // Delete statuses referencing this service line first
      await prisma.serviceLineStatus.deleteMany({ where: { serviceLineId: old.id } });
      await prisma.serviceLine.delete({ where: { id: old.id } });
      console.log(`  Removed old service line: ${old.name}`);
    }
  }

  for (const sl of standardServiceLines) {
    await prisma.serviceLine.upsert({
      where: { name: sl.name },
      update: { sortOrder: sl.sortOrder, guidanceText: sl.guidanceText },
      create: {
        name: sl.name,
        category: ServiceLineCategory.STANDARD,
        sortOrder: sl.sortOrder,
        guidanceText: sl.guidanceText,
      },
    });
  }

  for (const sl of additionalServiceLines) {
    await prisma.serviceLine.upsert({
      where: { name: sl.name },
      update: { sortOrder: sl.sortOrder, guidanceText: sl.guidanceText },
      create: {
        name: sl.name,
        category: ServiceLineCategory.ADDITIONAL,
        sortOrder: sl.sortOrder,
        guidanceText: sl.guidanceText,
      },
    });
  }

  console.log(`Seeded ${standardServiceLines.length + additionalServiceLines.length} service lines.`);

  // Create default admin user
  const hash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hash,
      displayName: "System Admin",
      email: "admin@rollsroyce.com",
      role: "ADMIN",
    },
  });

  console.log("Created default admin user (username: admin, password: admin123)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

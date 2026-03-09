import { PrismaClient } from "./lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: "admin" } });
  console.log("User found:", user ? "YES" : "NO");
  if (user) {
    console.log("isActive:", user.isActive);
    console.log("role:", user.role);
    const valid = await bcrypt.compare("admin123", user.passwordHash);
    console.log("Password valid:", valid);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

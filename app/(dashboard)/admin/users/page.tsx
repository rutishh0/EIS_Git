export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminUsersClient } from "@/components/eis/admin-users-client";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [users, airlines] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        jobTitle: true,
        role: true,
        isActive: true,
        createdAt: true,
        managedAirlines: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.airline.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminUsersClient
      users={JSON.parse(JSON.stringify(users))}
      airlines={JSON.parse(JSON.stringify(airlines))}
    />
  );
}

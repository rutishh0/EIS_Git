import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
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
    });

    return NextResponse.json(users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { username, displayName, email, password, role, jobTitle, managedAirlineIds } = body;

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: "username, displayName, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email: email || null,
        passwordHash,
        role: role || "VIEWER",
        jobTitle: jobTitle || null,
        ...(Array.isArray(managedAirlineIds) && managedAirlineIds.length > 0
          ? { managedAirlines: { connect: managedAirlineIds.map((id: string) => ({ id })) } }
          : {}),
      },
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
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 500 });
  }
}

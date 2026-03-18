import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import {
  getUserNotifications,
  getUnreadCount,
} from "@/lib/queries/notifications";

/**
 * Resolve the authenticated user id from either session cookie or Bearer token.
 */
async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Try session cookie first (web dashboard)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // Fall back to Bearer token (mobile app)
  const auth = await authenticateMobileRequest(request);
  if (auth) return auth.userId;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(userId, limit),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAllRead === true) {
      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, updated: result.count });
    }

    if (body.id && body.read === true) {
      const result = await prisma.notification.updateMany({
        where: { id: body.id, userId },
        data: { isRead: true },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (body.id && body.dismissed === true) {
      const result = await prisma.notification.updateMany({
        where: { id: body.id, userId },
        data: { isDismissed: true },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide markAllRead, or id with read/dismissed" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

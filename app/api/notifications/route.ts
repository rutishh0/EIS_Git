import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} from "@/lib/queries/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, limit),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAll) {
      await markAllRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await markNotificationRead(body.notificationId, session.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "notificationId or markAll required" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

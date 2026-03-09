import { NextRequest, NextResponse } from "next/server";
import { updateServiceLineStatus } from "@/lib/actions/scorecard";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceLineStatusId, ...data } = body;

    if (!serviceLineStatusId) {
      return NextResponse.json(
        { error: "serviceLineStatusId is required" },
        { status: 400 }
      );
    }

    const updated = await updateServiceLineStatus(serviceLineStatusId, data);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

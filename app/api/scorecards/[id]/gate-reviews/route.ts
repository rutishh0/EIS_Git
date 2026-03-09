import { NextRequest, NextResponse } from "next/server";
import { updateGateReview } from "@/lib/actions/scorecard";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateReviewId, ...data } = body;

    if (!gateReviewId) {
      return NextResponse.json(
        { error: "gateReviewId is required" },
        { status: 400 }
      );
    }

    const updated = await updateGateReview(gateReviewId, data);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

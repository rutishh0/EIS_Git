import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { corsHeaders } from "../cors";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateMobileRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const stats = await getDashboardStats();
    return NextResponse.json(stats, { headers: corsHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

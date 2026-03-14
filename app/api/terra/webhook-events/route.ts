import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { TerraEvent } from "@/lib/db/models/TerraEvent";

/**
 * GET /api/terra/webhook-events
 *
 * Reads stored webhook events from MongoDB for the dashboard.
 *
 * Query params:
 *   - reference_id (required) — your user ID
 *   - terra_user_id (optional) — filter by specific Terra user
 *   - type (optional) — "activity" | "daily" | "sleep" | "body" | "nutrition"
 *   - start_date (optional) — YYYY-MM-DD, filter events starting from this date
 *   - end_date (optional) — YYYY-MM-DD, filter events ending before this date
 *   - limit (optional) — max results, default 50
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const referenceId = searchParams.get("reference_id");
    const terraUserId = searchParams.get("terra_user_id");
    const type = searchParams.get("type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    if (!referenceId && !terraUserId) {
      return NextResponse.json(
        { error: "reference_id or terra_user_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    if (referenceId) query.reference_id = referenceId;
    if (terraUserId) query.terra_user_id = terraUserId;
    if (type) query.type = type;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate + "T00:00:00Z");
      if (endDate) dateFilter.$lte = new Date(endDate + "T23:59:59Z");
      query.start_time = dateFilter;
    }

    const events = await TerraEvent.find(query)
      .sort({ start_time: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ events, count: events.length });
  } catch (err: unknown) {
    console.error("[webhook-events] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

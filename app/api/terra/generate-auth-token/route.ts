import { NextRequest, NextResponse } from "next/server";
import { TERRA_BASE, terraHeaders } from "@/lib/terra/config";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const referenceId = body.reference_id;

    if (!referenceId) {
      return NextResponse.json(
        { error: "reference_id is required" },
        { status: 400 },
      );
    }

    const devId = process.env.TERRA_DEV_ID;
    const apiKey = process.env.TERRA_API_KEY;

    if (!devId || !apiKey) {
      return NextResponse.json(
        { error: "TERRA_DEV_ID or TERRA_API_KEY is not set" },
        { status: 500 },
      );
    }

    const response = await fetch(`${TERRA_BASE}/auth/generateAuthToken`, {
      method: "POST",
      headers: terraHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Terra generateAuthToken error:", data);
      return NextResponse.json(
        { error: "Failed to generate auth token", details: data },
        { status: response.status },
      );
    }

    return NextResponse.json({
      token: data.token,
      expires_in: data.expires_in,
    });
  } catch (error: unknown) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

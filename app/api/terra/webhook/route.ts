import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { TerraUser } from "@/lib/db/models/TerraUser";
import { TerraEvent } from "@/lib/db/models/TerraEvent";
import { verifyTerraSignature } from "@/lib/terra/verifySignature";

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body BEFORE any parsing (required for HMAC verification)
    const rawBody = await req.text();

    // 2. Verify signature (skip in dev if SKIP_WEBHOOK_SIG=true)
    const skipSig = process.env.SKIP_WEBHOOK_SIG === "true";
    if (!skipSig) {
      const secret = process.env.TERRA_WEBHOOK_SECRET;
      if (!secret) {
        console.error("TERRA_WEBHOOK_SECRET is not set");
        return NextResponse.json({ status: "ok" }, { status: 200 });
      }

      const sigHeader = req.headers.get("terra-signature");
      const result = verifyTerraSignature(sigHeader, rawBody, secret);

      if (!result.valid) {
        console.warn("Webhook signature verification failed:", result.error);
        return NextResponse.json(
          { error: result.error },
          { status: 401 },
        );
      }
    }

    // 3. Parse JSON payload
    let payload = JSON.parse(rawBody);

    // 4. Handle ping mode (S3 pre-signed URL)
    if (payload.type === "s3_payload" && payload.url) {
      const s3Res = await fetch(payload.url);
      if (!s3Res.ok) {
        console.error("Failed to fetch S3 payload:", s3Res.statusText);
        return NextResponse.json({ status: "ok" }, { status: 200 });
      }
      payload = await s3Res.json();
    }

    // 5. Connect to database
    await connectDB();

    const eventType: string = payload.type;
    const user = payload.user;

    // 6. Route by event type
    switch (eventType) {
      case "auth": {
        // User connected — upsert TerraUser
        if (user?.user_id) {
          await TerraUser.findOneAndUpdate(
            { terra_user_id: user.user_id },
            {
              terra_user_id: user.user_id,
              reference_id: user.reference_id || payload.reference_id || "",
              provider: user.provider || "",
              scopes: user.scopes || "",
              active: true,
              updated_at: new Date(),
            },
            { upsert: true, new: true },
          );
          console.log(`[webhook] Auth success: ${user.user_id} (${user.provider})`);
        }
        break;
      }

      case "deauth":
      case "access_revoked": {
        // User disconnected — mark inactive
        if (user?.user_id) {
          await TerraUser.findOneAndUpdate(
            { terra_user_id: user.user_id },
            { active: false, updated_at: new Date() },
          );
          console.log(`[webhook] Deauth: ${user.user_id}`);
        }
        break;
      }

      case "activity":
      case "daily":
      case "sleep":
      case "body":
      case "nutrition": {
        // Health data events — upsert each data item
        const items: Array<Record<string, unknown>> = payload.data || [];
        const userId = user?.user_id || "";
        const referenceId = user?.reference_id || "";

        for (const item of items) {
          const metadata = (item.metadata || {}) as Record<string, unknown>;
          const summaryId =
            (metadata.summary_id as string) ||
            `${userId}_${eventType}_${metadata.start_time || Date.now()}`;

          await TerraEvent.findOneAndUpdate(
            { summary_id: summaryId },
            {
              terra_user_id: userId,
              reference_id: referenceId,
              type: eventType,
              summary_id: summaryId,
              start_time: metadata.start_time
                ? new Date(metadata.start_time as string)
                : undefined,
              end_time: metadata.end_time
                ? new Date(metadata.end_time as string)
                : undefined,
              payload: item,
              received_at: new Date(),
            },
            { upsert: true, new: true },
          );
        }

        console.log(
          `[webhook] ${eventType}: ${items.length} item(s) for user ${userId}`,
        );
        break;
      }

      default: {
        console.log(`[webhook] Unhandled event type: ${eventType}`);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err: unknown) {
    console.error("[webhook] Error processing webhook:", err);
    // Still return 200 to prevent Terra from retrying on our errors
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

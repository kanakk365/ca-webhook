import { createHmac, timingSafeEqual } from "crypto";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

interface VerifyResult {
  valid: boolean;
  error?: string;
}

/**
 * Verify a Terra webhook signature (HMAC-SHA256).
 *
 * Header format:  terra-signature: t=<timestamp>,v1=<hex_hmac>
 *
 * Signed payload = "{timestamp}.{rawBody}"
 * Key            = TERRA_WEBHOOK_SECRET
 */
export function verifyTerraSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret: string,
): VerifyResult {
  if (!signatureHeader) {
    return { valid: false, error: "Missing terra-signature header" };
  }

  // Parse header: "t=123456,v1=abcdef..."
  const parts: Record<string, string> = {};
  for (const segment of signatureHeader.split(",")) {
    const eqIdx = segment.indexOf("=");
    if (eqIdx === -1) continue;
    const key = segment.slice(0, eqIdx).trim();
    const value = segment.slice(eqIdx + 1).trim();
    parts[key] = value;
  }

  const timestamp = parts["t"];
  const receivedSig = parts["v1"];

  if (!timestamp || !receivedSig) {
    return { valid: false, error: "Invalid signature format" };
  }

  // Check timestamp freshness
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_MS / 1000) {
    return { valid: false, error: "Timestamp too old or in future" };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSig = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Constant-time comparison
  const a = Buffer.from(expectedSig, "utf8");
  const b = Buffer.from(receivedSig, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, error: "Signature mismatch" };
  }

  return { valid: true };
}

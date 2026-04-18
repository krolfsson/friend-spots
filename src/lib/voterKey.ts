import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/** First client IP (Vercel / proxy sets x-forwarded-for). */
export function getRequestClientIp(req: NextRequest | Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "0.0.0.0";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVoterToken(raw: string | null | undefined): raw is string {
  if (!raw || typeof raw !== "string") return false;
  const t = raw.trim();
  return t.length === 36 && UUID_RE.test(t);
}

/**
 * One voter per browser token + IP; only hash is stored.
 * Set VOTER_PEPPER in production (long random string).
 */
export function makeVoterKey(voterToken: string, ip: string): string {
  const pepper = process.env.VOTER_PEPPER?.trim() || "friend-spots-dev-pepper";
  return createHash("sha256").update(`${pepper}:${voterToken}:${ip}`, "utf8").digest("hex");
}

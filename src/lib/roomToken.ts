import { createHmac, timingSafeEqual } from "crypto";

export const ROOM_ACCESS_COOKIE = "fs_room";

function secret(): string {
  return process.env.ROOM_TOKEN_SECRET?.trim() || "dev-room-token-secret-change-me";
}

/** 90 dagars åtkomstbevis (httpOnly-cookie). */
export function signRoomAccessToken(roomId: string, roomSlug: string): string {
  const exp = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
  const payloadObj = { roomId, slug: roomSlug, exp };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verifierar signatur och utgång. Rum matchas mot DB via `room.id` + URL-slug — funkar om slug byts (t.ex. gemener). */
export function verifyRoomAccessToken(token: string): { roomId: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const want = createHmac("sha256", secret()).update(payload).digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(want, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      roomId: string;
      slug: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof data.roomId !== "string" || !data.roomId) return null;
    return { roomId: data.roomId };
  } catch {
    return null;
  }
}

export function roomAccessCookieOptions() {
  const maxAge = 90 * 24 * 60 * 60;
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

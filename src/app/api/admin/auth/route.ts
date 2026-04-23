import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const adminPin = process.env.ADMIN_PIN?.trim();
  if (!adminPin) {
    return NextResponse.json({ error: "ADMIN_PIN not configured" }, { status: 500 });
  }
  const body = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!body.pin || body.pin.trim() !== adminPin) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

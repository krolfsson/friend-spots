import { NextResponse } from "next/server";
import { autocompletePlaces } from "@/lib/google/placesServer";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { input?: string; regionCode?: string };
    const input = body.input?.trim() ?? "";
    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] satisfies unknown[] });
    }

    const suggestions = await autocompletePlaces(input, body.regionCode);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

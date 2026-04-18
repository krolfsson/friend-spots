import { NextResponse } from "next/server";
import { fetchPlaceEssentials } from "@/lib/google/placesServer";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { placeId?: string };
    if (!body.placeId) {
      return NextResponse.json({ error: "placeId saknas" }, { status: 400 });
    }

    const place = await fetchPlaceEssentials(body.placeId);
    return NextResponse.json({ place });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

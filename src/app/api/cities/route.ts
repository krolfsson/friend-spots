import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function GET() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { spots: true } } },
  });
  return NextResponse.json({ cities });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; slug?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Namn saknas" }, { status: 400 });
    }

    let slug = body.slug?.trim() ? slugify(body.slug) : slugify(name);
    if (!slug) slug = "stad";

    const exists = await prisma.city.findUnique({ where: { slug } });
    if (exists) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const created = await prisma.city.create({ data: { name, slug } });
    const city = await prisma.city.findUnique({
      where: { id: created.id },
      include: { _count: { select: { spots: true } } },
    });
    if (!city) {
      return NextResponse.json({ error: "Kunde inte läsa skapad stad" }, { status: 500 });
    }
    return NextResponse.json({ city });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

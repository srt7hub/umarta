import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { parseEventBody } from "@/lib/validation";

// GET /api/events — список мероприятий с рассчитанной стоимостью
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { dishes: { include: { dish: true } } },
  });

  const result = events.map((e) => {
    const perGuest = e.dishes.reduce(
      (sum, ed) => sum + ed.dish.pricePerGuest,
      0
    );
    return {
      id: e.id,
      token: e.token,
      title: e.title,
      clientName: e.clientName,
      eventDate: e.eventDate,
      guests: e.guests,
      status: e.status,
      perGuest,
      total: perGuest * e.guests,
      dishCount: e.dishes.length,
    };
  });

  return NextResponse.json(result);
}

// POST /api/events — создать мероприятие
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = parseEventBody(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const event = await prisma.event.create({ data: parsed.data });
  return NextResponse.json(event, { status: 201 });
}

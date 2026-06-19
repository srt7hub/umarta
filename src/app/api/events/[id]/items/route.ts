import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

// POST /api/events/:id/items — добавить ручную позицию сметы мероприятия.
// Тело: { name: string, price: number (рубли), perGuest: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    price?: unknown;
    perGuest?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Название обязательно" }, { status: 400 });

  const priceRubles = Number(body.price);
  if (!Number.isFinite(priceRubles)) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }

  const item = await prisma.eventItem.create({
    data: {
      eventId: id,
      name,
      amount: Math.round(priceRubles * 100),
      perGuest: Boolean(body.perGuest),
    },
  });

  return NextResponse.json(item, { status: 201 });
}

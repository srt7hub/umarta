import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";

// POST /api/public/events/:token/confirm — подтвердить меню
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const event = await prisma.event.findUnique({
    where: { token },
    include: { dishes: true, items: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
  if (event.status === "CONFIRMED") {
    return NextResponse.json(
      { error: "Меню уже подтверждено" },
      { status: 409 }
    );
  }

  // Снимок цен на момент подтверждения: тянем актуальные значения из каталога
  // и записываем в EventDish/EventItem, чтобы итог зафиксировался.
  const dishIds = event.dishes.map((d) => d.dishId);
  const catalog = dishIds.length
    ? await prisma.dish.findMany({
        where: { id: { in: dishIds } },
        select: { id: true, pricePerGuest: true, perEvent: true, informational: true },
      })
    : [];
  const byId = new Map(catalog.map((d) => [d.id, d]));

  await prisma.$transaction([
    ...event.dishes.map((ed) => {
      const d = byId.get(ed.dishId);
      return prisma.eventDish.update({
        where: { id: ed.id },
        data: {
          priceAtConfirm: d?.pricePerGuest ?? 0,
          perEventAtConfirm: d?.perEvent ?? false,
          informationalAtConfirm: d?.informational ?? false,
        },
      });
    }),
    ...event.items.map((it) =>
      prisma.eventItem.update({
        where: { id: it.id },
        data: { amountAtConfirm: it.amount },
      })
    ),
    prisma.event.update({
      where: { id: event.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        guestsAtConfirm: event.guests,
      },
    }),
  ]);

  const updated = await getEventByToken(token);
  return NextResponse.json(updated);
}

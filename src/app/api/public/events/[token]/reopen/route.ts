import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";

// POST /api/public/events/:token/reopen — вернуть подтверждённое меню
// обратно в редактирование (CONFIRMED → DRAFT).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const event = await prisma.event.findUnique({ where: { token } });
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
  if (event.status === "DRAFT") {
    // Уже редактируется — ничего не меняем, отдаём актуальное состояние.
    const current = await getEventByToken(token);
    return NextResponse.json(current);
  }

  // Возврат в редактирование: сбрасываем снимок цен — цены снова живые.
  await prisma.$transaction([
    prisma.eventDish.updateMany({
      where: { eventId: event.id },
      data: {
        priceAtConfirm: null,
        perEventAtConfirm: null,
        informationalAtConfirm: null,
      },
    }),
    prisma.eventItem.updateMany({
      where: { eventId: event.id },
      data: { amountAtConfirm: null },
    }),
    prisma.event.update({
      where: { id: event.id },
      data: { status: "DRAFT", confirmedAt: null, guestsAtConfirm: null },
    }),
  ]);

  const updated = await getEventByToken(token);
  return NextResponse.json(updated);
}

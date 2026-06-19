import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";

// GET /api/public/events/:token — данные мероприятия для клиента
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const event = await getEventByToken(token);
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
  return NextResponse.json(event);
}

// PATCH /api/public/events/:token — обновить выбор блюд и/или гостей.
// Запрещено после подтверждения.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as {
    selectedDishIds?: unknown;
    guests?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { token } });
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
  if (event.status === "CONFIRMED") {
    return NextResponse.json(
      { error: "Меню уже подтверждено и не может быть изменено" },
      { status: 409 }
    );
  }

  // Обновление количества гостей
  if (body.guests !== undefined) {
    const guests = Number(body.guests);
    if (!Number.isInteger(guests) || guests < 1) {
      return NextResponse.json(
        { error: "Количество гостей должно быть не меньше 1" },
        { status: 400 }
      );
    }
    await prisma.event.update({ where: { id: event.id }, data: { guests } });
  }

  // Обновление выбора блюд (полная замена набора)
  if (body.selectedDishIds !== undefined) {
    if (!Array.isArray(body.selectedDishIds)) {
      return NextResponse.json(
        { error: "selectedDishIds должен быть массивом" },
        { status: 400 }
      );
    }
    const ids = body.selectedDishIds.filter(
      (x): x is string => typeof x === "string"
    );

    // Принимаем только существующие активные блюда
    const valid = await prisma.dish.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true },
    });

    // Обязательные позиции (например, обслуживание) включаются всегда,
    // даже если клиент их не прислал — снять их нельзя.
    const mandatory = await prisma.dish.findMany({
      where: { active: true, mandatory: true },
      select: { id: true },
    });

    const validIds = Array.from(
      new Set([...valid.map((d) => d.id), ...mandatory.map((d) => d.id)])
    );

    await prisma.$transaction([
      prisma.eventDish.deleteMany({ where: { eventId: event.id } }),
      prisma.eventDish.createMany({
        data: validIds.map((dishId) => ({ eventId: event.id, dishId })),
      }),
    ]);
  }

  const updated = await getEventByToken(token);
  return NextResponse.json(updated);
}

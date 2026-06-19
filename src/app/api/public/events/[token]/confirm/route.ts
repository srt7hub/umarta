import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";

// POST /api/public/events/:token/confirm — подтвердить меню
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const event = await prisma.event.findUnique({ where: { token } });
  if (!event) {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
  if (event.status === "CONFIRMED") {
    return NextResponse.json(
      { error: "Меню уже подтверждено" },
      { status: 409 }
    );
  }

  await prisma.event.update({
    where: { id: event.id },
    data: { status: "CONFIRMED" },
  });

  const updated = await getEventByToken(token);
  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

// PATCH /api/events/:id — обновить задаток: сумму (depositAmount, в рублях)
// и/или отметку «оплачен» (depositPaid). Поля независимы и оба опциональны.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: { depositAmount?: number; depositPaid?: boolean } = {};

  if (body && "depositAmount" in body) {
    const rub = body.depositAmount;
    if (typeof rub !== "number" || !Number.isFinite(rub) || rub < 0) {
      return NextResponse.json({ error: "Некорректная сумма задатка" }, { status: 400 });
    }
    data.depositAmount = Math.round(rub * 100);
  }

  if (body && "depositPaid" in body) {
    if (typeof body.depositPaid !== "boolean") {
      return NextResponse.json({ error: "Некорректная отметка задатка" }, { status: 400 });
    }
    data.depositPaid = body.depositPaid;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  try {
    const event = await prisma.event.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      depositAmount: event.depositAmount,
      depositPaid: event.depositPaid,
    });
  } catch {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
}

// DELETE /api/events/:id — удалить мероприятие (вместе с выбранными блюдами)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    // EventDish удаляются каскадно (onDelete: Cascade в схеме)
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  }
}

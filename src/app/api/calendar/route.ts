import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { dayKeyToUtcDate, toDayKey } from "@/lib/format";

// GET /api/calendar?year=2026&month=6 — закрытые даты и мероприятия за месяц.
// month — 1..12. Возвращаем диапазон [первое число; первое число след. месяца).
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Некорректный месяц" }, { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const [blocked, events] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { date: { gte: from, lt: to } },
      orderBy: { date: "asc" },
    }),
    prisma.event.findMany({
      where: { eventDate: { gte: from, lt: to } },
      select: { id: true, title: true, eventDate: true, status: true },
      orderBy: { eventDate: "asc" },
    }),
  ]);

  return NextResponse.json({
    blocked: blocked.map((b) => ({
      day: toDayKey(b.date),
      note: b.note,
      createdBy: b.createdBy,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      day: toDayKey(e.eventDate),
    })),
  });
}

// POST /api/calendar — закрыть дату { date: "YYYY-MM-DD", note?: string }.
// Идемпотентно: повторное закрытие обновляет заметку.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const date = dayKeyToUtcDate(body?.date);
  if (!date) {
    return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
  }
  const note =
    typeof body?.note === "string" && body.note.trim()
      ? body.note.trim()
      : null;

  const blocked = await prisma.blockedDate.upsert({
    where: { date },
    create: { date, note, createdBy: auth.email },
    update: { note },
  });

  return NextResponse.json({
    day: toDayKey(blocked.date),
    note: blocked.note,
    createdBy: blocked.createdBy,
  });
}

// DELETE /api/calendar — открыть дату { date: "YYYY-MM-DD" }.
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const date = dayKeyToUtcDate(body?.date);
  if (!date) {
    return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
  }

  await prisma.blockedDate.deleteMany({ where: { date } });
  return NextResponse.json({ ok: true });
}

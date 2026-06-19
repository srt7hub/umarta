import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { parseDishBody } from "@/lib/validation";

// PUT /api/dishes/:id — редактировать блюдо
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = parseDishBody(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const dish = await prisma.dish.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(dish);
  } catch {
    return NextResponse.json({ error: "Блюдо не найдено" }, { status: 404 });
  }
}

// DELETE /api/dishes/:id — удалить блюдо
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await prisma.dish.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Блюдо не найдено" }, { status: 404 });
  }
}

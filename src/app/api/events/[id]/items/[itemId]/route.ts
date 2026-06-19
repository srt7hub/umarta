import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

// DELETE /api/events/:id/items/:itemId — удалить ручную позицию сметы.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id, itemId } = await params;
  try {
    await prisma.eventItem.delete({ where: { id: itemId, eventId: id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

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

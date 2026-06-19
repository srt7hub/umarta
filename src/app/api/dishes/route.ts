import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { parseDishBody } from "@/lib/validation";

// GET /api/dishes — список блюд (для админки)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const dishes = await prisma.dish.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(dishes);
}

// POST /api/dishes — создать блюдо
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = parseDishBody(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const dish = await prisma.dish.create({ data: parsed.data });
  return NextResponse.json(dish, { status: 201 });
}

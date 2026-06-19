import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/dishes — только активные блюда для клиента
export async function GET() {
  const dishes = await prisma.dish.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      pricePerGuest: true,
      imageUrl: true,
    },
  });
  return NextResponse.json(dishes);
}

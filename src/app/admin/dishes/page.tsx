import { prisma } from "@/lib/prisma";
import { DishesManager } from "./DishesManager";

export const dynamic = "force-dynamic";

export default async function DishesPage() {
  const dishes = await prisma.dish.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Передаём в клиент цену в рублях для удобного редактирования
  const initial = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    category: d.category,
    pricePerGuest: d.pricePerGuest,
    imageUrl: d.imageUrl,
    active: d.active,
  }));

  return <DishesManager initialDishes={initial} />;
}

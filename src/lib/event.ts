import { prisma } from "./prisma";

// Загружает мероприятие по токену вместе с выбранными блюдами и
// рассчитывает стоимость на сервере (источник истины).
export async function getEventByToken(token: string) {
  const event = await prisma.event.findUnique({
    where: { token },
    include: { dishes: true },
  });
  if (!event) return null;

  const selectedDishIds = event.dishes.map((d) => d.dishId);
  const perGuest = await selectedPerGuest(selectedDishIds);

  return {
    id: event.id,
    token: event.token,
    title: event.title,
    clientName: event.clientName,
    eventDate: event.eventDate,
    guests: event.guests,
    status: event.status,
    selectedDishIds,
    perGuest,
    total: perGuest * event.guests,
  };
}

// Сумма цен выбранных активных блюд за одного гостя.
async function selectedPerGuest(dishIds: string[]): Promise<number> {
  if (dishIds.length === 0) return 0;
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
    select: { pricePerGuest: true },
  });
  return dishes.reduce((sum, d) => sum + d.pricePerGuest, 0);
}

export type ClientEvent = NonNullable<Awaited<ReturnType<typeof getEventByToken>>>;

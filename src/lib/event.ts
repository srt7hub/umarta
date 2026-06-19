import { prisma } from "./prisma";
import { computeCost } from "./cost";

// Загружает мероприятие по токену вместе с выбранными блюдами и
// рассчитывает стоимость на сервере (источник истины).
export async function getEventByToken(token: string) {
  const event = await prisma.event.findUnique({
    where: { token },
    include: { dishes: true, items: true },
  });
  if (!event) return null;

  const selectedDishIds = event.dishes.map((d) => d.dishId);

  // Тянем цену и признак perEvent выбранных блюд
  const dishItems = selectedDishIds.length
    ? await prisma.dish.findMany({
        where: { id: { in: selectedDishIds } },
        select: { pricePerGuest: true, perEvent: true, informational: true },
      })
    : [];

  // Ручные позиции мероприятия приводим к формату расчёта.
  // perGuest=false (фикс) → perEvent=true, не зависит от числа гостей.
  const manualItems = event.items.map((it) => ({
    pricePerGuest: it.amount,
    perEvent: !it.perGuest,
  }));

  const cost = computeCost([...dishItems, ...manualItems], event.guests);

  return {
    id: event.id,
    token: event.token,
    title: event.title,
    clientName: event.clientName,
    eventDate: event.eventDate,
    guests: event.guests,
    status: event.status,
    selectedDishIds,
    items: event.items.map((it) => ({
      id: it.id,
      name: it.name,
      amount: it.amount,
      perGuest: it.perGuest,
    })),
    perGuest: cost.perGuest,
    eventFees: cost.eventFees,
    total: cost.total,
  };
}

export type ClientEvent = NonNullable<Awaited<ReturnType<typeof getEventByToken>>>;

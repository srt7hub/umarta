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
  const confirmed = event.status === "CONFIRMED";

  // Число гостей: у подтверждённого берём зафиксированное (на случай, если
  // кто-то поменяет event.guests после подтверждения).
  const guests = confirmed
    ? event.guestsAtConfirm ?? event.guests
    : event.guests;

  // Снимок считается валидным, только если у блюд реально записаны цены.
  // События, подтверждённые до внедрения снимка (priceAtConfirm = null),
  // не имеют его — для них откатываемся на живые цены каталога.
  const hasSnapshot =
    confirmed && event.dishes.some((ed) => ed.priceAtConfirm != null);

  let dishItems: { pricePerGuest: number; perEvent: boolean; informational: boolean }[];

  if (hasSnapshot) {
    // Считаем из снимка цен, каталог игнорируем.
    dishItems = event.dishes.map((ed) => ({
      pricePerGuest: ed.priceAtConfirm ?? 0,
      perEvent: ed.perEventAtConfirm ?? false,
      informational: ed.informationalAtConfirm ?? false,
    }));
  } else {
    // Черновик или старое подтверждение без снимка → живые цены из каталога.
    dishItems = selectedDishIds.length
      ? await prisma.dish.findMany({
          where: { id: { in: selectedDishIds } },
          select: { pricePerGuest: true, perEvent: true, informational: true },
        })
      : [];
  }

  // Ручные позиции: при наличии снимка — зафиксированная сумма, иначе живая.
  // perGuest=false (фикс) → perEvent=true, не зависит от числа гостей.
  const manualItems = event.items.map((it) => ({
    pricePerGuest: hasSnapshot ? it.amountAtConfirm ?? it.amount : it.amount,
    perEvent: !it.perGuest,
  }));

  const cost = computeCost([...dishItems, ...manualItems], guests);

  return {
    id: event.id,
    token: event.token,
    title: event.title,
    clientName: event.clientName,
    eventDate: event.eventDate,
    guests,
    status: event.status,
    confirmedAt: event.confirmedAt,
    selectedDishIds,
    items: event.items.map((it) => ({
      id: it.id,
      name: it.name,
      amount: hasSnapshot ? it.amountAtConfirm ?? it.amount : it.amount,
      perGuest: it.perGuest,
    })),
    perGuest: cost.perGuest,
    eventFees: cost.eventFees,
    total: cost.total,
  };
}

export type ClientEvent = NonNullable<Awaited<ReturnType<typeof getEventByToken>>>;

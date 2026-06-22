import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { formatDate, formatKopecks } from "@/lib/format";
import { getEventByToken } from "@/lib/event";
import { StatusBadge } from "@/components/ui";
import { Category } from "@prisma/client";
import { EventLink } from "./EventLink";
import { DeleteEventButton } from "./DeleteEventButton";
import { EventItems } from "./EventItems";
import { DepositField } from "./DepositField";

export const dynamic = "force-dynamic";

export default async function AdminEventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { dishes: { include: { dish: true } }, items: true },
  });
  if (!event) notFound();

  const confirmed = event.status === "CONFIRMED";
  // Снимок валиден, только если у блюд реально записаны цены (старые события,
  // подтверждённые до внедрения снимка, его не имеют → показываем живые цены).
  const hasSnapshot =
    confirmed && event.dishes.some((ed) => ed.priceAtConfirm != null);
  const guests = hasSnapshot ? event.guestsAtConfirm ?? event.guests : event.guests;

  // Итоги берём из единого источника истины (учитывает снимок цен у
  // подтверждённых мероприятий), а не пересчитываем из живого каталога.
  const summary = await getEventByToken(event.token);
  const { perGuest, eventFees, total } = summary!;

  // Цена блюда для отображения: при наличии снимка — зафиксированная, иначе из каталога.
  const dishRows = event.dishes.map((ed) => ({
    id: ed.dish.id,
    name: ed.dish.name,
    description: ed.dish.description,
    category: ed.dish.category,
    price: hasSnapshot ? ed.priceAtConfirm ?? 0 : ed.dish.pricePerGuest,
  }));

  // Вклад ручных позиций в итог (для отдельной строки в сводке)
  const itemsTotal = event.items.reduce((s, it) => {
    const amount = hasSnapshot ? it.amountAtConfirm ?? it.amount : it.amount;
    return s + (it.perGuest ? amount * guests : amount);
  }, 0);

  // Группировка выбранных блюд по категориям
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat as Category,
    dishes: dishRows.filter((d) => d.category === cat),
  })).filter((g) => g.dishes.length > 0);

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-stone-500 hover:text-stone-700 inline-flex items-center gap-1 mb-4"
      >
        ← Все мероприятия
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-stone-900">
              {event.title}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Клиент: {event.clientName} · {formatDate(event.eventDate)} ·{" "}
            {event.guests} гостей
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/event/${event.token}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            🖨 Распечатать смету
          </a>
          <DeleteEventButton id={event.id} title={event.title} />
        </div>
      </div>

      <EventLink token={event.token} />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-stone-900">
            Выбранное клиентом меню
          </h2>

          {dishRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
              Клиент ещё не выбрал блюда.
            </div>
          ) : (
            byCategory.map((group) => (
              <div key={group.category}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-2">
                  {CATEGORY_LABELS[group.category]}
                </h3>
                <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
                  {group.dishes.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-stone-900">{d.name}</p>
                        {d.description && (
                          <p className="text-sm text-stone-500">
                            {d.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-stone-600 whitespace-nowrap">
                        {formatKopecks(d.price)} / гость
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <EventItems
            eventId={event.id}
            items={event.items.map((it) => ({
              id: it.id,
              name: it.name,
              amount: confirmed ? it.amountAtConfirm ?? it.amount : it.amount,
              perGuest: it.perGuest,
            }))}
            guests={guests}
            locked={confirmed}
          />
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-stone-900">Итог</h3>
            {hasSnapshot && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Цены зафиксированы при подтверждении
                {summary!.confirmedAt
                  ? ` ${formatDate(summary!.confirmedAt)}`
                  : ""}
                .
              </p>
            )}
            <Row label="Блюд выбрано" value={String(dishRows.length)} />
            <Row label="Гостей" value={String(guests)} />
            <Row
              label="Стоимость на гостя"
              value={formatKopecks(perGuest)}
            />
            <Row
              label={`На гостях (× ${guests})`}
              value={formatKopecks(perGuest * guests)}
            />
            {eventFees > 0 && (
              <Row
                label="Услуги за мероприятие"
                value={formatKopecks(eventFees)}
              />
            )}
            {itemsTotal > 0 && (
              <Row
                label="Доп. позиции"
                value={formatKopecks(itemsTotal)}
              />
            )}
            <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
              <span className="font-semibold text-stone-900">Итого</span>
              <span className="text-xl font-semibold text-brand-700">
                {formatKopecks(total)}
              </span>
            </div>
            <Row label="Задаток" value={`− ${formatKopecks(event.depositAmount)}`} />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Осталось доплатить</span>
              <span className="font-semibold text-stone-900">
                {formatKopecks(total - event.depositAmount)}
              </span>
            </div>
            <div className="border-t border-stone-200 pt-4">
              <DepositField
                eventId={event.id}
                initialKopecks={event.depositAmount}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}

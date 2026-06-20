import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { formatDate, formatKopecks } from "@/lib/format";
import { Category } from "@prisma/client";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function EventPrintPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const event = await getEventByToken(token);
  if (!event) notFound();

  const confirmed = event.status === "CONFIRMED";

  // Выбранные блюда с ценами. У подтверждённого мероприятия берём снимок
  // (EventDish.priceAtConfirm), иначе живые цены из каталога.
  const eventDishes = await prisma.eventDish.findMany({
    where: { eventId: event.id },
    include: { dish: true },
  });
  const dishes = eventDishes.map((ed) => ({
    id: ed.dish.id,
    name: ed.dish.name,
    description: ed.dish.description,
    category: ed.dish.category,
    pricePerGuest: confirmed ? ed.priceAtConfirm ?? 0 : ed.dish.pricePerGuest,
    perEvent: confirmed ? ed.perEventAtConfirm ?? false : ed.dish.perEvent,
    informational: confirmed
      ? ed.informationalAtConfirm ?? false
      : ed.dish.informational,
  }));

  // Информационные позиции (отметка «нужно») показываем отдельно — без цены в итоге
  const priced = dishes.filter((d) => !d.informational);
  const info = dishes.filter((d) => d.informational);

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat as Category,
    dishes: priced.filter((d) => d.category === cat),
  })).filter((g) => g.dishes.length > 0);

  const guestTotal = event.perGuest * event.guests;
  const itemsTotal = event.items.reduce(
    (s, it) => s + (it.perGuest ? it.amount * event.guests : it.amount),
    0
  );

  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-8 text-stone-900 print:px-0 print:py-0">
      {/* Панель действий — не печатается */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <a
          href={`/event/${token}`}
          className="text-sm font-medium text-stone-500 hover:text-stone-700"
        >
          ← Назад к меню
        </a>
        <PrintButton />
      </div>

      {/* Шапка документа */}
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <dl className="mt-2 space-y-0.5 text-sm text-stone-600">
            <div>
              <span className="text-stone-400">Клиент:</span> {event.clientName}
            </div>
            <div>
              <span className="text-stone-400">Дата:</span>{" "}
              {formatDate(event.eventDate)}
            </div>
            <div>
              <span className="text-stone-400">Гостей:</span> {event.guests}
            </div>
          </dl>
        </div>
        <Image
          src="/umarta.jpg"
          alt="Умарта"
          width={220}
          height={140}
          priority
          className="h-16 w-auto object-contain"
        />
      </header>

      {/* Меню по категориям */}
      <section className="mt-6 space-y-5">
        {byCategory.length === 0 ? (
          <p className="text-stone-500">Блюда ещё не выбраны.</p>
        ) : (
          byCategory.map((group) => (
            <div key={group.category} className="break-inside-avoid">
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                {CATEGORY_LABELS[group.category]}
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {group.dishes.map((d) => (
                    <tr key={d.id} className="border-b border-stone-100 last:border-0">
                      <td className="py-1.5 pr-4 align-top">
                        <span className="font-medium">{d.name}</span>
                        {d.description && (
                          <span className="block text-xs text-stone-500">
                            {d.description}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-1.5 text-right align-top text-stone-600">
                        {formatKopecks(d.pricePerGuest)}
                        {d.perEvent ? " / зал" : " / гость"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* Дополнительные позиции */}
      {event.items.length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Дополнительные позиции
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {event.items.map((it) => (
                <tr key={it.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-1.5 pr-4 align-top font-medium">{it.name}</td>
                  <td className="whitespace-nowrap py-1.5 text-right align-top text-stone-600">
                    {formatKopecks(it.amount)}
                    {it.perGuest ? " / гость" : " · фикс."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Информационные позиции (без цены в итоге) */}
      {info.length > 0 && (
        <section className="mt-6 break-inside-avoid text-sm">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Отмечено клиентом (оплачивается отдельно)
          </h2>
          <ul className="space-y-0.5 text-stone-600">
            {info.map((d) => (
              <li key={d.id}>
                {d.name}{" "}
                <span className="text-stone-400">
                  — от {formatKopecks(d.pricePerGuest)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Итоговая смета */}
      <section className="mt-6 break-inside-avoid border-t-2 border-stone-900 pt-4">
        <table className="w-full text-sm">
          <tbody>
            <Line label="Стоимость на гостя" value={formatKopecks(event.perGuest)} />
            <Line
              label={`Гости (× ${event.guests})`}
              value={formatKopecks(guestTotal)}
            />
            {event.eventFees > 0 && (
              <Line label="Услуги за зал" value={formatKopecks(event.eventFees)} />
            )}
            {itemsTotal > 0 && (
              <Line label="Дополнительные позиции" value={formatKopecks(itemsTotal)} />
            )}
          </tbody>
        </table>
        <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3">
          <span className="text-base font-semibold">ИТОГО</span>
          <span className="text-2xl font-semibold text-brand-700">
            {formatKopecks(event.total)}
          </span>
        </div>
      </section>

      <footer className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-400">
        Банкетный зал «Умарта» · смета сформирована {formatDate(new Date())} ·
        предварительный расчёт, итоговая стоимость уточняется при согласовании.
      </footer>
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 text-stone-500">{label}</td>
      <td className="py-1 text-right font-medium">{value}</td>
    </tr>
  );
}

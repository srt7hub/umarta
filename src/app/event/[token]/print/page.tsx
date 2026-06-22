import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventByToken } from "@/lib/event";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { formatDate } from "@/lib/format";
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

  // Список блюд для кухни — без цен. При наличии снимка (подтверждённое
  // мероприятие) учитываем зафиксированную пометку «информационное».
  const eventDishes = await prisma.eventDish.findMany({
    where: { eventId: event.id },
    include: { dish: true },
  });
  const hasSnapshot =
    event.status === "CONFIRMED" &&
    eventDishes.some((ed) => ed.priceAtConfirm != null);
  const dishes = eventDishes.map((ed) => ({
    id: ed.dish.id,
    name: ed.dish.name,
    description: ed.dish.description,
    category: ed.dish.category,
    informational: hasSnapshot
      ? ed.informationalAtConfirm ?? false
      : ed.dish.informational,
  }));

  // Информационные позиции (отметка «нужно») показываем отдельным списком
  const priced = dishes.filter((d) => !d.informational);
  const info = dishes.filter((d) => d.informational);

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat as Category,
    dishes: priced.filter((d) => d.category === cat),
  })).filter((g) => g.dishes.length > 0);

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
              <ul className="text-sm">
                {group.dishes.map((d) => (
                  <li
                    key={d.id}
                    className="border-b border-stone-100 py-1.5 last:border-0"
                  >
                    <span className="font-medium">{d.name}</span>
                    {d.description && (
                      <span className="block text-xs text-stone-500">
                        {d.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
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
          <ul className="text-sm">
            {event.items.map((it) => (
              <li
                key={it.id}
                className="border-b border-stone-100 py-1.5 font-medium last:border-0"
              >
                {it.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Информационные позиции */}
      {info.length > 0 && (
        <section className="mt-6 break-inside-avoid text-sm">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Отмечено клиентом
          </h2>
          <ul className="space-y-0.5 text-stone-600">
            {info.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-400">
        Банкетный зал «Умарта» · {event.guests} гостей · лист сформирован{" "}
        {formatDate(new Date())}.
      </footer>
    </main>
  );
}

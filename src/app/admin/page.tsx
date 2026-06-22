import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatKopecks } from "@/lib/format";
import { computeCost } from "@/lib/cost";
import { StatusBadge } from "@/components/ui";
import { CreateEventButton } from "./CreateEventButton";
import { DepositCheckbox } from "./DepositCheckbox";

export const dynamic = "force-dynamic";

async function getEvents() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { dishes: { include: { dish: true } } },
  });
  return events.map((e) => {
    const cost = computeCost(
      e.dishes.map((ed) => ed.dish),
      e.guests
    );
    return { ...e, perGuest: cost.perGuest, total: cost.total };
  });
}

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Мероприятия</h1>
          <p className="text-sm text-stone-500 mt-1">
            Создавайте мероприятия и отправляйте клиентам ссылку на меню.
          </p>
        </div>
        <CreateEventButton />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-500">Пока нет мероприятий.</p>
          <p className="text-sm text-stone-400 mt-1">
            Нажмите «Создать мероприятие», чтобы начать.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium text-right">Гостей</th>
                  <th className="px-4 py-3 font-medium text-right">Стоимость</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-center">Задаток</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/60">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {e.title}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(e.eventDate)}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {e.guests}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900">
                      {formatKopecks(e.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DepositCheckbox eventId={e.id} initial={e.depositPaid} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="text-brand-700 hover:text-brand-800 font-medium"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

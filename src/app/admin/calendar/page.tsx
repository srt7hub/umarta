import { CalendarGrid } from "./CalendarGrid";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const now = new Date();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Календарь</h1>
        <p className="text-sm text-stone-500 mt-1">
          Занятость по датам. Дни с мероприятиями отмечаются автоматически;
          остальные можно вручную закрыть, чтобы не приняли заказ дважды.
        </p>
      </div>
      <CalendarGrid
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth() + 1}
      />
    </div>
  );
}

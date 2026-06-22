"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui";

type BlockedDay = { day: string; note: string | null; createdBy: string | null };
type EventDay = { id: string; title: string; status: string; day: string };

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// "YYYY-MM-DD" для дня месяца (без учёта зоны — собираем вручную).
function dayKey(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function CalendarGrid({
  initialYear,
  initialMonth,
}: {
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 1..12
  const [blocked, setBlocked] = useState<Map<string, BlockedDay>>(new Map());
  const [events, setEvents] = useState<Map<string, EventDay[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null); // открытый попап (dayKey)
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const todayKey = useMemo(() => {
    const t = new Date();
    return dayKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (res.ok) {
      const data: { blocked: BlockedDay[]; events: EventDay[] } = await res.json();
      setBlocked(new Map(data.blocked.map((b) => [b.day, b])));
      const ev = new Map<string, EventDay[]>();
      for (const e of data.events) {
        const arr = ev.get(e.day) ?? [];
        arr.push(e);
        ev.set(e.day, arr);
      }
      setEvents(ev);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  function prevMonth() {
    setSelected(null);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    setSelected(null);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }
  function goToday() {
    const t = new Date();
    setSelected(null);
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
  }

  // Сетка дней месяца с выравниванием по понедельнику.
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // getUTCDay(): 0=вс..6=сб → приводим к 0=пн..6=вс
    const offset = (first.getUTCDay() + 6) % 7;
    const arr: (number | null)[] = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function openDay(key: string) {
    // Дни с мероприятием не закрываем вручную — они заняты по факту.
    if (events.has(key)) return;
    setSelected(key);
    setNote(blocked.get(key)?.note ?? "");
  }

  async function closeDate() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selected, note }),
    });
    setSaving(false);
    if (res.ok) {
      setSelected(null);
      load();
    } else alert("Не удалось закрыть дату");
  }

  async function openDate() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/calendar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selected }),
    });
    setSaving(false);
    if (res.ok) {
      setSelected(null);
      load();
    } else alert("Не удалось открыть дату");
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm">
      {/* Шапка с навигацией по месяцам */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-stone-600 hover:bg-stone-50"
            aria-label="Предыдущий месяц"
          >
            ←
          </button>
          <h2 className="min-w-[160px] text-center text-lg font-semibold text-stone-900">
            {MONTHS[month - 1]} {year}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-stone-600 hover:bg-stone-50"
            aria-label="Следующий месяц"
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Сегодня
        </button>
      </div>

      {/* Легенда */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500">
        <Legend className="bg-emerald-100 ring-emerald-300" label="Свободно" />
        <Legend className="bg-brand-100 ring-brand-300" label="Мероприятие" />
        <Legend className="bg-red-100 ring-red-300" label="Закрыто" />
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-stone-400 py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Сетка */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
            <Spinner className="text-brand-600" />
          </div>
        )}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const key = dayKey(year, month, d);
            const dayEvents = events.get(key);
            const block = blocked.get(key);
            const isToday = key === todayKey;

            let cls = "bg-emerald-50 hover:bg-emerald-100 ring-emerald-200";
            if (dayEvents) cls = "bg-brand-50 hover:bg-brand-100 ring-brand-200";
            else if (block) cls = "bg-red-50 hover:bg-red-100 ring-red-200";

            return (
              <button
                key={key}
                type="button"
                onClick={() => openDay(key)}
                className={`relative min-h-[68px] rounded-xl p-1.5 text-left ring-1 transition-colors ${cls} ${
                  dayEvents ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? "bg-stone-900 text-white" : "text-stone-700"
                  }`}
                >
                  {d}
                </span>
                {dayEvents && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <Link
                        key={e.id}
                        href={`/admin/events/${e.id}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="block truncate rounded bg-brand-600/90 px-1 py-0.5 text-[11px] text-white hover:bg-brand-700"
                        title={e.title}
                      >
                        {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block px-1 text-[11px] text-brand-700">
                        +{dayEvents.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {!dayEvents && block && (
                  <div className="mt-1 truncate px-0.5 text-[11px] text-red-700">
                    {block.note || "Закрыто"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Попап закрытия/открытия даты */}
      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-stone-900">
              {blocked.has(selected) ? "Дата закрыта" : "Закрыть дату"}
            </h3>
            <p className="mt-0.5 text-sm text-stone-500">{formatDayLabel(selected)}</p>

            <label className="mt-4 block text-sm text-stone-600">
              Причина (необязательно)
            </label>
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && closeDate()}
              placeholder="напр. выходной, бронь Иванов"
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            <div className="mt-5 flex items-center justify-between gap-2">
              {blocked.has(selected) ? (
                <button
                  type="button"
                  onClick={openDate}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Открыть дату
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={closeDate}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving && <Spinner />}
                  {blocked.has(selected) ? "Сохранить" : "Закрыть дату"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ring-1 ${className}`} />
      {label}
    </span>
  );
}

function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

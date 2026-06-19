"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Category } from "@prisma/client";
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_ICONS } from "@/lib/constants";
import { formatDate, formatKopecks } from "@/lib/format";
import { StatusBadge, Spinner } from "@/components/ui";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  pricePerGuest: number;
  imageUrl: string | null;
};

type EventData = {
  title: string;
  clientName: string;
  eventDate: string;
  guests: number;
  status: string;
  selectedDishIds: string[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function MenuSelector({
  token,
  event,
  dishes,
}: {
  token: string;
  event: EventData;
  dishes: Dish[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(event.selectedDishIds)
  );
  const [guests, setGuests] = useState(event.guests);
  const [status, setStatus] = useState(event.status);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState(false);
  // Блюдо, фото которого открыто в увеличенном виде (lightbox)
  const [zoomed, setZoomed] = useState<Dish | null>(null);

  const locked = status === "CONFIRMED";

  // --- Расчёт стоимости (мгновенно на клиенте) ---
  const perGuest = useMemo(() => {
    let sum = 0;
    for (const d of dishes) if (selected.has(d.id)) sum += d.pricePerGuest;
    return sum;
  }, [dishes, selected]);

  const total = perGuest * guests;

  // --- Сохранение на сервер с debounce ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const persist = useCallback(
    async (payload: { selectedDishIds?: string[]; guests?: number }) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/public/events/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        setSaveState("saved");
        setTimeout(
          () => setSaveState((s) => (s === "saved" ? "idle" : s)),
          1500
        );
      } catch {
        setSaveState("error");
      }
    },
    [token]
  );

  // Сохраняем изменения выбора/гостей (кроме первого рендера и при блокировке)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (locked) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist({ selectedDishIds: Array.from(selected), guests });
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [selected, guests, locked, persist]);

  function toggle(id: string) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changeGuests(value: number) {
    if (locked) return;
    setGuests(Math.max(1, Math.floor(value) || 1));
  }

  async function confirm() {
    if (selected.size === 0) {
      alert("Выберите хотя бы одно блюдо перед подтверждением.");
      return;
    }
    if (
      !window.confirm(
        "Подтвердить меню? При необходимости его можно будет снова открыть на редактирование."
      )
    )
      return;

    setConfirming(true);
    // Перед подтверждением гарантируем, что выбор сохранён
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist({ selectedDishIds: Array.from(selected), guests });

    const res = await fetch(`/api/public/events/${token}/confirm`, {
      method: "POST",
    });
    setConfirming(false);
    if (res.ok) {
      setStatus("CONFIRMED");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Не удалось подтвердить меню");
    }
  }

  // Вернуть подтверждённое меню в редактирование (CONFIRMED → DRAFT)
  async function reopen() {
    setConfirming(true);
    const res = await fetch(`/api/public/events/${token}/reopen`, {
      method: "POST",
    });
    setConfirming(false);
    if (res.ok) {
      setStatus("DRAFT");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Не удалось открыть меню для редактирования");
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat as Category,
    dishes: dishes.filter((d) => d.category === cat),
  })).filter((g) => g.dishes.length > 0);

  return (
    <div className="min-h-screen pb-32 lg:pb-12">
      {/* Шапка мероприятия */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          {/* Логотип ресторана */}
          <div className="flex justify-center border-b border-stone-100 py-6">
            <Image
              src="/umarta.jpg"
              alt="Умарта"
              width={320}
              height={205}
              priority
              className="h-20 w-auto object-contain sm:h-24"
            />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 py-5">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">
                {event.title}
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {event.clientName} · {formatDate(event.eventDate)}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
      </header>

      {locked && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <span>Меню подтверждено. Чтобы изменить выбор — откройте его для редактирования.</span>
            <button
              onClick={reopen}
              disabled={confirming}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 whitespace-nowrap"
            >
              {confirming && <Spinner />}
              Редактировать меню
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-6 grid gap-8 lg:grid-cols-3">
        {/* Меню */}
        <div className="lg:col-span-2 space-y-8">
          {grouped.map((group) => (
            <section key={group.category}>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg ring-1 ring-brand-100">
                  {CATEGORY_ICONS[group.category]}
                </span>
                <h2 className="text-lg font-semibold text-stone-900">
                  {CATEGORY_LABELS[group.category]}
                </h2>
                <span className="ml-auto text-sm text-stone-400">
                  {group.dishes.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.dishes.map((d) => {
                  const isSel = selected.has(d.id);
                  return (
                    <div
                      key={d.id}
                      role="checkbox"
                      aria-checked={isSel}
                      tabIndex={locked ? -1 : 0}
                      onClick={() => toggle(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(d.id);
                        }
                      }}
                      className={`text-left rounded-2xl border bg-white p-3 sm:p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                        isSel
                          ? "border-brand-500 ring-1 ring-brand-500 shadow-sm"
                          : "border-stone-200 hover:border-stone-300"
                      } ${locked ? "cursor-default opacity-90" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isSel
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {isSel && (
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>

                        {/* Компактное превью фото (если есть). Тап — увеличение. */}
                        {d.imageUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomed(d);
                            }}
                            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                            aria-label={`Увеличить фото: ${d.name}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={d.imageUrl}
                              alt={d.name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-medium text-stone-900">
                              {d.name}
                            </p>
                            <span className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                              {formatKopecks(d.pricePerGuest)}
                            </span>
                          </div>
                          {d.description && (
                            <p className="text-sm text-stone-500 mt-0.5">
                              {d.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Сводка (desktop) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <Summary
              guests={guests}
              perGuest={perGuest}
              total={total}
              selectedCount={selected.size}
              locked={locked}
              onGuestsChange={changeGuests}
              onConfirm={confirm}
              confirming={confirming}
              saveState={saveState}
              status={status}
            />
          </div>
        </aside>
      </div>

      {/* Сводка (mobile, прилипает к низу) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Summary
            compact
            guests={guests}
            perGuest={perGuest}
            total={total}
            selectedCount={selected.size}
            locked={locked}
            onGuestsChange={changeGuests}
            onConfirm={confirm}
            confirming={confirming}
            saveState={saveState}
            status={status}
          />
        </div>
      </div>

      {/* Lightbox: увеличенное фото блюда */}
      {zoomed?.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4"
          onClick={() => setZoomed(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomed(null)}
              className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg hover:bg-stone-100"
              aria-label="Закрыть"
            >
              ×
            </button>
            <div className="overflow-hidden rounded-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomed.imageUrl}
                alt={zoomed.name}
                className="max-h-[70vh] w-full object-contain bg-stone-50"
              />
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="font-medium text-stone-900">{zoomed.name}</p>
                <span className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                  {formatKopecks(zoomed.pricePerGuest)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({
  guests,
  perGuest,
  total,
  selectedCount,
  locked,
  onGuestsChange,
  onConfirm,
  confirming,
  saveState,
  status,
  compact = false,
}: {
  guests: number;
  perGuest: number;
  total: number;
  selectedCount: number;
  locked: boolean;
  onGuestsChange: (v: number) => void;
  onConfirm: () => void;
  confirming: boolean;
  saveState: SaveState;
  status: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex items-center gap-4" : "space-y-5"}>
      {!compact && (
        <h3 className="font-semibold text-stone-900">Ваш банкет</h3>
      )}

      {/* Количество гостей */}
      <div className={compact ? "" : ""}>
        {!compact && (
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Количество гостей
          </label>
        )}
        <div className="inline-flex items-center rounded-lg border border-stone-300">
          <button
            type="button"
            onClick={() => onGuestsChange(guests - 1)}
            disabled={locked || guests <= 1}
            className="h-9 w-9 text-stone-600 hover:bg-stone-100 disabled:opacity-40 rounded-l-lg"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => onGuestsChange(Number(e.target.value))}
            disabled={locked}
            className="h-9 w-14 text-center text-sm outline-none disabled:bg-transparent"
          />
          <button
            type="button"
            onClick={() => onGuestsChange(guests + 1)}
            disabled={locked}
            className="h-9 w-9 text-stone-600 hover:bg-stone-100 disabled:opacity-40 rounded-r-lg"
          >
            +
          </button>
        </div>
      </div>

      {!compact && (
        <div className="space-y-2 border-t border-stone-200 pt-4">
          <Row label="Блюд выбрано" value={String(selectedCount)} />
          <Row label="Стоимость на гостя" value={formatKopecks(perGuest)} />
          <Row label="Гостей" value={`× ${guests}`} />
        </div>
      )}

      <div
        className={
          compact
            ? "ml-auto text-right"
            : "border-t border-stone-200 pt-4 flex items-center justify-between"
        }
      >
        {!compact && (
          <span className="font-semibold text-stone-900">Итого</span>
        )}
        <div className={compact ? "" : "text-right"}>
          {compact && (
            <p className="text-xs text-stone-500">
              {selectedCount} блюд · {formatKopecks(perGuest)}/гость
            </p>
          )}
          <span className="text-2xl font-semibold text-brand-700">
            {formatKopecks(total)}
          </span>
        </div>
      </div>

      {!locked && (
        <>
          {!compact && <SaveIndicator state={saveState} />}
          <button
            onClick={onConfirm}
            disabled={confirming || selectedCount === 0}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors ${
              compact ? "" : "w-full"
            }`}
          >
            {confirming && <Spinner />}
            Подтвердить меню
          </button>
        </>
      )}

      {locked && !compact && (
        <p className="text-sm text-emerald-700 text-center">
          ✓ Меню подтверждено
        </p>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<SaveState, "idle">, { text: string; cls: string }> = {
    saving: { text: "Сохранение…", cls: "text-stone-400" },
    saved: { text: "Сохранено", cls: "text-emerald-600" },
    error: { text: "Ошибка сохранения", cls: "text-red-500" },
  };
  const m = map[state];
  return <p className={`text-xs text-center ${m.cls}`}>{m.text}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}

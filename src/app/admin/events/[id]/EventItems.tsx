"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKopecks } from "@/lib/format";
import { Spinner } from "@/components/ui";

type Item = {
  id: string;
  name: string;
  amount: number; // копейки
  perGuest: boolean;
};

export function EventItems({
  eventId,
  items,
  guests,
  locked = false,
}: {
  eventId: string;
  items: Item[];
  guests: number;
  locked?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [perGuest, setPerGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Введите название позиции");
      return;
    }
    if (price === "" || !Number.isFinite(Number(price))) {
      setError("Введите цену");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), price: Number(price), perGuest }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось добавить позицию");
      return;
    }
    setName("");
    setPrice("");
    setPerGuest(false);
    router.refresh();
  }

  async function remove(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/events/${eventId}/items/${id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else alert("Не удалось удалить позицию");
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="font-semibold text-stone-900">Дополнительные позиции</h3>
        <span className="text-xs text-stone-400">входят в итог клиента</span>
      </div>
      <p className="text-sm text-stone-500 mb-4">
        {locked
          ? "Меню подтверждено — позиции зафиксированы. Чтобы изменить, верните меню в редактирование."
          : "Услуги, аренда и прочее вручную. Клиент видит их в общей стоимости."}
      </p>

      {items.length > 0 && (
        <ul className="mb-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
          {items.map((it) => {
            const lineTotal = it.perGuest ? it.amount * guests : it.amount;
            return (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{it.name}</p>
                  <p className="text-xs text-stone-500">
                    {formatKopecks(it.amount)}
                    {it.perGuest ? ` / гость × ${guests}` : " · фиксированно"}
                  </p>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-sm font-semibold text-stone-900">
                    {formatKopecks(lineTotal)}
                  </span>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => remove(it.id)}
                      disabled={deletingId === it.id}
                      className="text-stone-400 hover:text-red-500 disabled:opacity-50"
                      aria-label={`Удалить позицию ${it.name}`}
                    >
                      {deletingId === it.id ? <Spinner /> : "×"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!locked && (
      <form onSubmit={add} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (напр. Аренда зала)"
            className="ei-input"
          />
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цена ₽"
            className="ei-input"
          />
        </div>

        {/* Тип цены: фикс ↔ на гостя */}
        <div className="inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setPerGuest(false)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              !perGuest ? "bg-brand-600 text-white" : "text-stone-600"
            }`}
          >
            Фиксированно
          </button>
          <button
            type="button"
            onClick={() => setPerGuest(true)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              perGuest ? "bg-brand-600 text-white" : "text-stone-600"
            }`}
          >
            На гостя
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading && <Spinner />}+ Добавить позицию
        </button>
      </form>
      )}

      <style jsx global>{`
        .ei-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(214 211 209);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .ei-input:focus {
          border-color: #c8851a;
          box-shadow: 0 0 0 1px #c8851a;
        }
      `}</style>
    </div>
  );
}

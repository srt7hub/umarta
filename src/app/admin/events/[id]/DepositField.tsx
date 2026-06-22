"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

// Редактируемая сумма задатка (в рублях). Хранится в БД в копейках.
export function DepositField({
  eventId,
  initialKopecks,
}: {
  eventId: string;
  initialKopecks: number;
}) {
  const router = useRouter();
  const initialRub = initialKopecks ? String(initialKopecks / 100) : "";
  const [value, setValue] = useState(initialRub);
  const [saved, setSaved] = useState(initialRub);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dirty = value.trim() !== saved.trim();

  async function save() {
    setError("");
    const rub = value.trim() === "" ? 0 : Number(value);
    if (!Number.isFinite(rub) || rub < 0) {
      setError("Введите корректную сумму");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAmount: rub }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(value.trim());
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось сохранить задаток");
    }
  }

  return (
    <div>
      <label className="text-sm text-stone-500">Задаток, ₽</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          placeholder="0"
          className="dep-input"
        />
        <button
          type="button"
          onClick={save}
          disabled={loading || !dirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {loading && <Spinner />}Сохранить
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <style jsx global>{`
        .dep-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(214 211 209);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .dep-input:focus {
          border-color: #c8851a;
          box-shadow: 0 0 0 1px #c8851a;
        }
      `}</style>
    </div>
  );
}

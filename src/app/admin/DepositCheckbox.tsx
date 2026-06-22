"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Галочка «задаток оплачен» прямо в строке списка мероприятий.
// withLabel — отрисовать подпись «Задаток» (для мобильных карточек);
// при этом клик не «проваливается» в карточку-ссылку.
export function DepositCheckbox({
  eventId,
  initial,
  withLabel = false,
}: {
  eventId: string;
  initial: boolean;
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [paid, setPaid] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !paid;
    setPaid(next); // оптимистично
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositPaid: next }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setPaid(!next); // откат
      alert("Не удалось сохранить отметку о задатке");
    }
  }

  const checkbox = (
    <input
      type="checkbox"
      checked={paid}
      disabled={loading}
      onChange={toggle}
      aria-label="Задаток оплачен"
      className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-600 accent-brand-600 disabled:opacity-50"
    />
  );

  if (!withLabel) return checkbox;

  // Останавливаем всплытие, чтобы клик по галочке/подписи не открывал карточку.
  return (
    <label
      className="flex items-center gap-2 text-sm text-stone-600"
      onClick={(e) => e.stopPropagation()}
    >
      {checkbox}
      Задаток
    </label>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

export function DeleteEventButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        `Удалить мероприятие «${title}»? Действие необратимо.`
      )
    )
      return;

    setLoading(true);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Не удалось удалить мероприятие");
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
    >
      {loading && <Spinner />}
      Удалить мероприятие
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

export function CreateEventButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    title: "",
    clientName: "",
    eventDate: "",
    guests: 50,
  });

  function reset() {
    setForm({ title: "", clientName: "", eventDate: "", guests: 50 });
    setError("");
    setCreatedLink(null);
    setCopied(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось создать мероприятие");
      return;
    }
    const event = await res.json();
    setCreatedLink(`${window.location.origin}/event/${event.token}`);
    router.refresh();
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
      >
        + Создать мероприятие
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-stone-900">
                {createdLink ? "Мероприятие создано" : "Новое мероприятие"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {createdLink ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-stone-600">
                  Отправьте клиенту персональную ссылку на выбор меню:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={createdLink}
                    className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-700"
                  />
                  <button
                    onClick={copyLink}
                    className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 whitespace-nowrap"
                  >
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="p-6 space-y-4">
                <Field label="Название мероприятия">
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Свадьба Ивановых"
                    className="input"
                  />
                </Field>
                <Field label="Имя клиента">
                  <input
                    required
                    value={form.clientName}
                    onChange={(e) =>
                      setForm({ ...form, clientName: e.target.value })
                    }
                    placeholder="Иван Петров"
                    className="input"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Дата">
                    <input
                      required
                      type="date"
                      value={form.eventDate}
                      onChange={(e) =>
                        setForm({ ...form, eventDate: e.target.value })
                      }
                      className="input"
                    />
                  </Field>
                  <Field label="Гостей">
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.guests}
                      onChange={(e) =>
                        setForm({ ...form, guests: Number(e.target.value) })
                      }
                      className="input"
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {loading && <Spinner />}
                    Создать
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #3b6ea5;
          box-shadow: 0 0 0 1px #3b6ea5;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

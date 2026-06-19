"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { formatKopecks } from "@/lib/format";
import { Spinner } from "@/components/ui";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  pricePerGuest: number; // копейки
  imageUrl: string | null;
  active: boolean;
};

type FormState = {
  name: string;
  description: string;
  category: Category;
  price: string; // рубли (строка ввода)
  imageUrl: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: Category.APPETIZER,
  price: "",
  imageUrl: "",
  active: true,
};

export function DishesManager({ initialDishes }: { initialDishes: Dish[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Dish | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить фото");
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(d: Dish) {
    setEditing(d);
    setForm({
      name: d.name,
      description: d.description ?? "",
      category: d.category,
      price: (d.pricePerGuest / 100).toString(),
      imageUrl: d.imageUrl ?? "",
      active: d.active,
    });
    setError("");
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      active: form.active,
    };
    const res = await fetch(
      editing ? `/api/dishes/${editing.id}` : "/api/dishes",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function onDelete(d: Dish) {
    if (!confirm(`Удалить блюдо «${d.name}»?`)) return;
    const res = await fetch(`/api/dishes/${d.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Не удалось удалить блюдо");
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat as Category,
    dishes: initialDishes.filter((d) => d.category === cat),
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Блюда</h1>
          <p className="text-sm text-stone-500 mt-1">
            Каталог меню банкетного зала.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 whitespace-nowrap"
        >
          + Добавить блюдо
        </button>
      </div>

      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">
              {CATEGORY_LABELS[group.category]}{" "}
              <span className="text-stone-300">({group.dishes.length})</span>
            </h2>
            {group.dishes.length === 0 ? (
              <p className="text-sm text-stone-400">Нет блюд в этой категории.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.dishes.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-stone-900">{d.name}</p>
                      {!d.active && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 whitespace-nowrap">
                          Скрыто
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                        {d.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold text-stone-900">
                        {formatKopecks(d.pricePerGuest)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => onDelete(d)}
                          className="text-sm font-medium text-red-500 hover:text-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-stone-900">
                {editing ? "Редактировать блюдо" : "Новое блюдо"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <Field label="Название">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="dish-input"
                />
              </Field>
              <Field label="Описание">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="dish-input resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Категория">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as Category,
                      })
                    }
                    className="dish-input"
                  >
                    {CATEGORY_ORDER.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Цена за гостя (₽)">
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="dish-input"
                  />
                </Field>
              </div>
              <Field label="Фото блюда (опционально)">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileSelected}
                  className="hidden"
                />
                {form.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                      <Image
                        src={form.imageUrl}
                        alt="Превью"
                        fill
                        sizes="80px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-60 text-left"
                      >
                        Заменить фото
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: "" })}
                        className="text-sm font-medium text-red-500 hover:text-red-600 text-left"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-6 text-sm font-medium text-stone-500 hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Spinner /> Загрузка…
                      </>
                    ) : (
                      <>↑ Выбрать фото с компьютера</>
                    )}
                  </button>
                )}
              </Field>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                />
                Активно (видно клиентам)
              </label>

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
                  disabled={loading || uploading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {loading && <Spinner />}
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .dish-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .dish-input:focus {
          border-color: #c8851a;
          box-shadow: 0 0 0 1px #c8851a;
        }
      `}</style>
    </div>
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

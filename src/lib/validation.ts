import { Category } from "@prisma/client";

const CATEGORIES = Object.values(Category);

export type DishInput = {
  name: string;
  description: string | null;
  category: Category;
  pricePerGuest: number; // в копейках
  imageUrl: string | null;
  active: boolean;
};

// Парсит и валидирует тело запроса для блюда. Цена приходит в рублях.
export function parseDishBody(body: unknown):
  | { ok: true; data: DishInput }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Некорректное тело запроса" };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "Название обязательно" };

  if (!CATEGORIES.includes(b.category as Category)) {
    return { ok: false, error: "Некорректная категория" };
  }

  const priceRubles = Number(b.price);
  if (!Number.isFinite(priceRubles) || priceRubles < 0) {
    return { ok: false, error: "Некорректная цена" };
  }

  const description =
    typeof b.description === "string" && b.description.trim()
      ? b.description.trim()
      : null;
  const imageUrl =
    typeof b.imageUrl === "string" && b.imageUrl.trim()
      ? b.imageUrl.trim()
      : null;
  const active = b.active === undefined ? true : Boolean(b.active);

  return {
    ok: true,
    data: {
      name,
      description,
      category: b.category as Category,
      pricePerGuest: Math.round(priceRubles * 100),
      imageUrl,
      active,
    },
  };
}

export type EventInput = {
  title: string;
  clientName: string;
  eventDate: Date;
  guests: number;
};

export function parseEventBody(body: unknown):
  | { ok: true; data: EventInput }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Некорректное тело запроса" };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { ok: false, error: "Название мероприятия обязательно" };

  const clientName = typeof b.clientName === "string" ? b.clientName.trim() : "";
  if (!clientName) return { ok: false, error: "Имя клиента обязательно" };

  const eventDate = b.eventDate ? new Date(b.eventDate as string) : null;
  if (!eventDate || isNaN(eventDate.getTime())) {
    return { ok: false, error: "Некорректная дата" };
  }

  const guests = Number(b.guests);
  if (!Number.isInteger(guests) || guests < 1) {
    return { ok: false, error: "Количество гостей должно быть не меньше 1" };
  }

  return { ok: true, data: { title, clientName, eventDate, guests } };
}

// Цены хранятся в копейках. Утилиты конвертации и форматирования.

export function kopecksToRubles(kopecks: number): number {
  return kopecks / 100;
}

export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Принимает значение в копейках, возвращает строку вида "1 234 ₽"
export function formatKopecks(kopecks: number): string {
  return rubFormatter.format(kopecks / 100);
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

// Для input type="date"
export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// Ключ дня "YYYY-MM-DD" в UTC — для сопоставления дат без учёта времени/зоны.
export function toDayKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

// "YYYY-MM-DD" → Date в полночь UTC. null, если строка некорректна.
export function dayKeyToUtcDate(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const d = new Date(`${key}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

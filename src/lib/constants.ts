import { Category } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  FIRST_COURSE: "Первые блюда",
  SIDE_DISH: "Гарниры",
  FISH: "Рыбные блюда",
  MEAT: "Мясные блюда",
  COLD_APPETIZER: "Холодные закуски",
  APPETIZER: "Закуски",
  SALAD: "Салаты",
  DRINK: "Напитки",
};

// Иконки-обложки категорий для визуального разделения списка
export const CATEGORY_ICONS: Record<Category, string> = {
  FIRST_COURSE: "🍲",
  SIDE_DISH: "🍚",
  FISH: "🐟",
  MEAT: "🥩",
  COLD_APPETIZER: "🧀",
  APPETIZER: "🍢",
  SALAD: "🥗",
  DRINK: "🥤",
};

// Порядок отображения категорий
export const CATEGORY_ORDER: Category[] = [
  Category.FIRST_COURSE,
  Category.SIDE_DISH,
  Category.FISH,
  Category.MEAT,
  Category.COLD_APPETIZER,
  Category.APPETIZER,
  Category.SALAD,
  Category.DRINK,
];

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  CONFIRMED: "Подтверждено",
};

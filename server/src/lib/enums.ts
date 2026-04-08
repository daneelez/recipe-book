import type { CookingNeed, DishCategory, ProductCategory } from "@prisma/client";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  FROZEN: "Замороженный",
  MEAT: "Мясной",
  VEGETABLES: "Овощи",
  GREENS: "Зелень",
  SPICES: "Специи",
  GRAINS: "Крупы",
  CANNED: "Консервы",
  LIQUID: "Жидкость",
  SWEETS: "Сладости",
};

export const COOKING_NEED_LABELS: Record<CookingNeed, string> = {
  READY_TO_EAT: "Готовый к употреблению",
  SEMI_FINISHED: "Полуфабрикат",
  REQUIRES_COOKING: "Требует приготовления",
};

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  DESSERT: "Десерт",
  FIRST: "Первое",
  SECOND: "Второе",
  DRINK: "Напиток",
  SALAD: "Салат",
  SOUP: "Суп",
  SNACK: "Перекус",
};

export type FlagKey = "VEGAN" | "GLUTEN_FREE" | "SUGAR_FREE";

export const FLAG_LABELS: Record<FlagKey, string> = {
  VEGAN: "Веган",
  GLUTEN_FREE: "Без глютена",
  SUGAR_FREE: "Без сахара",
};

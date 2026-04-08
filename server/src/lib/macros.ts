import type { DishCategory } from "@prisma/client";

const MACRO_ORDER: { pattern: RegExp; category: DishCategory }[] = [
  { pattern: /!десерт/i, category: "DESSERT" },
  { pattern: /!первое/i, category: "FIRST" },
  { pattern: /!второе/i, category: "SECOND" },
  { pattern: /!напиток/i, category: "DRINK" },
  { pattern: /!салат/i, category: "SALAD" },
  { pattern: /!суп/i, category: "SOUP" },
  { pattern: /!перекус/i, category: "SNACK" },
];

export function extractDishMacro(name: string): { cleanName: string; categoryFromMacro: DishCategory | null } {
  for (const { pattern, category } of MACRO_ORDER) {
    if (pattern.test(name)) {
      const cleanName = name.replace(pattern, "").replace(/\s+/g, " ").trim();
      return { cleanName, categoryFromMacro: category };
    }
  }
  return { cleanName: name, categoryFromMacro: null };
}

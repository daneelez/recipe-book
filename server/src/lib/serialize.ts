import type { Dish, Product } from "@prisma/client";
import {
  COOKING_NEED_LABELS,
  DISH_CATEGORY_LABELS,
  FLAG_LABELS,
  PRODUCT_CATEGORY_LABELS,
  type FlagKey,
} from "./enums.js";
import { parseFlagsJson } from "./flags.js";

export function productToDto(p: Product) {
  const flags = parseFlagsJson(p.flagsJson) as FlagKey[];
  return {
    id: p.id,
    name: p.name,
    photos: JSON.parse(p.photosJson || "[]") as string[],
    caloriesPer100g: p.caloriesPer100g,
    proteinPer100g: p.proteinPer100g,
    fatPer100g: p.fatPer100g,
    carbsPer100g: p.carbsPer100g,
    composition: p.composition,
    category: p.category,
    categoryLabel: PRODUCT_CATEGORY_LABELS[p.category],
    cookingNeed: p.cookingNeed,
    cookingNeedLabel: COOKING_NEED_LABELS[p.cookingNeed],
    flags,
    flagsLabels: flags.map((f) => FLAG_LABELS[f]),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}

export function dishToDto(
  d: Dish,
  ingredients: { productId: string; grams: number; product: ReturnType<typeof productToDto> }[]
) {
  const flags = parseFlagsJson(d.flagsJson) as FlagKey[];
  return {
    id: d.id,
    name: d.name,
    photos: JSON.parse(d.photosJson || "[]") as string[],
    caloriesPerPortion: d.caloriesPerPortion,
    proteinPerPortion: d.proteinPerPortion,
    fatPerPortion: d.fatPerPortion,
    carbsPerPortion: d.carbsPerPortion,
    portionSizeG: d.portionSizeG,
    category: d.category,
    categoryLabel: DISH_CATEGORY_LABELS[d.category],
    flags,
    flagsLabels: flags.map((f) => FLAG_LABELS[f]),
    ingredients: ingredients.map((i) => ({
      productId: i.productId,
      grams: i.grams,
      product: i.product,
    })),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString() ?? null,
  };
}

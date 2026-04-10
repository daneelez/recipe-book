import type { IngredientRow } from "../kbju.js";

export const BASE: Omit<IngredientRow, "grams"> = {
  caloriesPer100g: 100,
  proteinPer100g: 10,
  fatPer100g: 5,
  carbsPer100g: 20,
};

export const GRAMS = {
  ZERO: 0,
  SMALL: 0.01,
  VERY_SMALL: 0.000001,
  NORMAL: 100,
  FRACTIONAL: 33.3,
  LARGE: 10000,
} as const;

export const PRECISION = 10;

export const createIngredient = (
  grams: number,
  overrides?: Partial<Omit<IngredientRow, "grams">>
): IngredientRow => ({
  ...BASE,
  grams,
  ...overrides,
});

export const scale = (valuePer100g: number, grams: number) =>
  valuePer100g * (grams / 100);
import { z } from "zod";
import type { CookingNeed, DishCategory, ProductCategory } from "@prisma/client";

const productCategoryZ = z.enum([
  "FROZEN",
  "MEAT",
  "VEGETABLES",
  "GREENS",
  "SPICES",
  "GRAINS",
  "CANNED",
  "LIQUID",
  "SWEETS",
]) as z.ZodType<ProductCategory>;

const cookingNeedZ = z.enum(["READY_TO_EAT", "SEMI_FINISHED", "REQUIRES_COOKING"]) as z.ZodType<CookingNeed>;

const dishCategoryZ = z.enum([
  "DESSERT",
  "FIRST",
  "SECOND",
  "DRINK",
  "SALAD",
  "SOUP",
  "SNACK",
]) as z.ZodType<DishCategory>;

const flagZ = z.enum(["VEGAN", "GLUTEN_FREE", "SUGAR_FREE"]);

export const productCreateSchema = z.object({
  name: z.string().min(2),
  photos: z.array(z.string()).max(5).optional().default([]),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0).max(100),
  fatPer100g: z.number().min(0).max(100),
  carbsPer100g: z.number().min(0).max(100),
  composition: z.string().nullable().optional(),
  category: productCategoryZ,
  cookingNeed: cookingNeedZ,
  flags: z.array(flagZ).optional().default([]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export function assertProductBjuSum(per100: { proteinPer100g: number; fatPer100g: number; carbsPer100g: number }) {
  const sum = per100.proteinPer100g + per100.fatPer100g + per100.carbsPer100g;
  if (sum > 100) {
    throw new ValidationError("Сумма белков, жиров и углеводов на 100 г не может превышать 100 г.");
  }
}

const ingredientSchema = z.object({
  productId: z.string().min(1),
  grams: z.number().positive(),
});

export const dishCreateSchema = z.object({
  name: z.string().min(2),
  photos: z.array(z.string()).max(5).optional().default([]),
  caloriesPerPortion: z.number().min(0),
  proteinPerPortion: z.number().min(0),
  fatPerPortion: z.number().min(0),
  carbsPerPortion: z.number().min(0),
  portionSizeG: z.number().positive(),
  category: dishCategoryZ,
  flags: z.array(flagZ).optional().default([]),
  ingredients: z.array(ingredientSchema).min(1),
});

export type DishCreateInput = z.infer<typeof dishCreateSchema>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

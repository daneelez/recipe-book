import { createApp } from '../app.js'
import request from 'supertest'

export const app = createApp();
export const api = request(app);

export const BASE = {
  name: "Продукт",
  photos: [],
  caloriesPer100g: 100,
  proteinPer100g: 10,
  fatPer100g: 10,
  carbsPer100g: 10,
  composition: null,
  category: "VEGETABLES",
  cookingNeed: "READY_TO_EAT",
  flags: [],
}

export function buildProduct(overrides: Partial<any> = {}) {
  return {
    ...BASE,
    ...overrides,
  };
}

export const DISH_BASE = {
  name: "Блюдо",
  photos: [],
  caloriesPerPortion: 100,
  proteinPerPortion: 10,
  fatPerPortion: 10,
  carbsPerPortion: 10,
  portionSizeG: 200,
  category: "SALAD",
  flags: [],
};

export async function createProduct(overrides: Partial<any> = {}) {
  return await api.post("/api/products").send(buildProduct(overrides));
}

export async function buildDish(overrides: Partial<any> = {}) {
  const product = (await createProduct()).body;

  return {
    ...DISH_BASE,
    ingredients: [
      {
        productId: product.id,
        grams: 100,
      },
    ],
    ...overrides,
  };
}
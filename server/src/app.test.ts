import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./prisma.js";

const app = createApp();

describe("API", () => {
  let productId: string;
  let dishId: string;

  beforeAll(async () => {
    await prisma.dishIngredient.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.product.deleteMany();
  });

  it("creates product", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Тест овощ",
      photos: [],
      caloriesPer100g: 30,
      proteinPer100g: 1,
      fatPer100g: 0,
      carbsPer100g: 6,
      composition: null,
      category: "VEGETABLES",
      cookingNeed: "READY_TO_EAT",
      flags: ["VEGAN"],
    });
    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  it("rejects product when BJU sum > 100", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Неверный БЖУ",
      photos: [],
      caloriesPer100g: 100,
      proteinPer100g: 40,
      fatPer100g: 40,
      carbsPer100g: 30,
      composition: null,
      category: "VEGETABLES",
      cookingNeed: "READY_TO_EAT",
      flags: [],
    });
    expect(res.status).toBe(400);
  });

  it("creates dish with macro stripped on server", async () => {
    const res = await request(app).post("/api/dishes").send({
      name: "Салат !салат вкусный",
      photos: [],
      caloriesPerPortion: 50,
      proteinPerPortion: 2,
      fatPerPortion: 1,
      carbsPerPortion: 5,
      portionSizeG: 200,
      category: "SALAD",
      flags: ["VEGAN"],
      ingredients: [{ productId, grams: 100 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).not.toContain("!салат");
    dishId = res.body.id;
  });

  it("blocks delete product used in dish", async () => {
    const res = await request(app).delete(`/api/products/${productId}`);
    expect(res.status).toBe(409);
    expect(res.body.dishes?.length).toBeGreaterThan(0);
  });

  it("deletes dish then product", async () => {
    await request(app).delete(`/api/dishes/${dishId}`).expect(204);
    await request(app).delete(`/api/products/${productId}`).expect(204);
  });
});

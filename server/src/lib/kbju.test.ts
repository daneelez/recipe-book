import { describe, expect, it } from "vitest";
import { computePortionKbju, dishBjuSumPer100g } from "./kbju.js";

describe("computePortionKbju", () => {
  it("sums per portion from 100g values", () => {
    const r = computePortionKbju([
      { caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20, grams: 200 },
    ]);
    expect(r.caloriesPerPortion).toBe(200);
    expect(r.proteinPerPortion).toBe(20);
    expect(r.fatPerPortion).toBe(10);
    expect(r.carbsPerPortion).toBe(40);
  });
});

describe("dishBjuSumPer100g", () => {
  it("rejects when sum per 100g exceeds 100", () => {
    const sum = dishBjuSumPer100g(30, 30, 45, 100);
    expect(sum).toBe(105);
  });
});

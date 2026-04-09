import { describe, expect, it } from "vitest";
import { computePortionKbju, type IngredientRow } from "../kbju.js";

const DEFAULT_INGREDIENT = { caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20 };

describe("utils/kbju/computePortionKbju", () => {
  it("пустой список ингредиентов: возвращает нули", () => {
    const r = computePortionKbju([]);
    expect(r).toEqual({
      caloriesPerPortion: 0,
      proteinPerPortion: 0,
      fatPerPortion: 0,
      carbsPerPortion: 0,
    });
  });

  it.each([
    {
      title: "правильно обрабатывает нулевые граммы",
      ingredients: [{ ...DEFAULT_INGREDIENT, grams: 0 }],
      expected: { caloriesPerPortion: 0, proteinPerPortion: 0, fatPerPortion: 0, carbsPerPortion: 0 },
    },
    {
      title: "правильно обрабатывает 100 грамм",
      ingredients: [{ ...DEFAULT_INGREDIENT, grams: 100 }],
      expected: { caloriesPerPortion: 100, proteinPerPortion: 10, fatPerPortion: 5, carbsPerPortion: 20 },
    },
    {
      title: "правильно обрабатывает любое количество грамм",
      ingredients: [{ ...DEFAULT_INGREDIENT, grams: 157 }],
      expected: { caloriesPerPortion: 157, proteinPerPortion: 15.7, fatPerPortion: 7.85, carbsPerPortion: 31.4 },
    },
    {
      title: "десятичные граммы: масштабируются пропорционально",
      ingredients: [{ ...DEFAULT_INGREDIENT, grams: 0.01 }],
      expected: {
        caloriesPerPortion: 0.01,
        proteinPerPortion: 0.001,
        fatPerPortion: 0.00001,
        carbsPerPortion: 0.0002,
      },
    },
  ] satisfies Array<{
    title: string;
    ingredients: IngredientRow[];
    expected: { caloriesPerPortion: number; proteinPerPortion: number; fatPerPortion: number; carbsPerPortion: number };
  }>)("$title", ({ ingredients, expected }) => {
    const r = computePortionKbju(ingredients);
    expect(r.caloriesPerPortion).toBeCloseTo(expected.caloriesPerPortion, 10);
    expect(r.proteinPerPortion).toBeCloseTo(expected.proteinPerPortion, 10);
    expect(r.fatPerPortion).toBeCloseTo(expected.fatPerPortion, 10);
    expect(r.carbsPerPortion).toBeCloseTo(expected.carbsPerPortion, 10);
  });

  it("суммирует несколько ингредиентов (независимо от порядка)", () => {
    const a: IngredientRow = { caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20, grams: 50 };
    const b: IngredientRow = { caloriesPer100g: 200, proteinPer100g: 0, fatPer100g: 1.5, carbsPer100g: 0, grams: 25 };

    const r1 = computePortionKbju([a, b]);
    const r2 = computePortionKbju([b, a]);

    expect(r1.caloriesPerPortion).toBeCloseTo(100 * 0.5 + 200 * 0.25, 10);
    expect(r1.proteinPerPortion).toBeCloseTo(10 * 0.5 + 0 * 0.25, 10);
    expect(r1.fatPerPortion).toBeCloseTo(5 * 0.5 + 1.5 * 0.25, 10);
    expect(r1.carbsPerPortion).toBeCloseTo(20 * 0.5 + 0 * 0.25, 10);

    expect(r2).toEqual(r1);
  });
});


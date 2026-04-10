import { describe, expect, it } from "vitest";
import { computePortionKbju, type IngredientRow } from "../kbju.js";
import { BASE, createIngredient, GRAMS, PRECISION, scale } from './config.js'

describe("utils/kbju/computePortionKbju", () => {
  /**
   * Один ингредиент
   */
  it.each([
    {
      title: "0 г",
      grams: GRAMS.ZERO,
    },
    {
      title: "малое значение",
      grams: GRAMS.SMALL,
    },
    {
      title: "очень малое значение",
      grams: GRAMS.VERY_SMALL,
    },
    {
      title: "ровно 100 г",
      grams: GRAMS.NORMAL,
    },
    {
      title: "дробное значение",
      grams: GRAMS.FRACTIONAL,
    },
    {
      title: "большое значение",
      grams: GRAMS.LARGE,
    },
  ])("$title", ({ grams }) => {
    const r = computePortionKbju([createIngredient(grams)]);

    expect(r.caloriesPerPortion).toBeCloseTo(scale(BASE.caloriesPer100g, grams), PRECISION);
    expect(r.proteinPerPortion).toBeCloseTo(scale(BASE.proteinPer100g, grams), PRECISION);
    expect(r.fatPerPortion).toBeCloseTo(scale(BASE.fatPer100g, grams), PRECISION);
    expect(r.carbsPerPortion).toBeCloseTo(scale(BASE.carbsPer100g, grams), PRECISION);
  });

  /**
   * Несколько ингредиентов
   */
  it.each([
    {
      title: "все ингредиенты 0 г",
      ingredients: [GRAMS.ZERO, GRAMS.ZERO],
    },
    {
      title: "смешанный (0 + нормальный)",
      ingredients: [GRAMS.ZERO, GRAMS.NORMAL],
    },
    {
      title: "два дробных",
      ingredients: [12.5, 7.25],
    },
    {
      title: "много маленьких",
      ingredients: Array.from({ length: 100 }, () => 0.1),
    },
  ])("$title", ({ ingredients }) => {
    const rows = ingredients.map((g) => createIngredient(g));
    const r = computePortionKbju(rows);

    const expectedCalories = ingredients.reduce(
      (sum, g) => sum + scale(BASE.caloriesPer100g, g),
      0
    );

    const expectedProtein = ingredients.reduce(
      (sum, g) => sum + scale(BASE.proteinPer100g, g),
      0
    );

    expect(r.caloriesPerPortion).toBeCloseTo(expectedCalories, PRECISION);
    expect(r.proteinPerPortion).toBeCloseTo(expectedProtein, PRECISION);
  });

  /**
   * Разные пропорции БЖУ
   */
  it.each([
    {
      title: "разные белки",
      ingredients: [
        createIngredient(GRAMS.NORMAL, { proteinPer100g: 11 }),
        createIngredient(GRAMS.NORMAL, { proteinPer100g: 50 }),
      ],
      expectedProtein: scale(11, GRAMS.NORMAL) + scale(50, GRAMS.NORMAL),
    },
    {
      title: "все БЖУ 0",
      ingredients: [
        createIngredient(GRAMS.NORMAL, {
          caloriesPer100g: 0,
          proteinPer100g: 0,
          fatPer100g: 0,
          carbsPer100g: 0,
        }),
      ],
      expectedAllZero: true,
    },
  ])("$title", ({ ingredients, expectedProtein, expectedAllZero }) => {
    const r = computePortionKbju(ingredients);

    if (expectedAllZero) {
      expect(r).toEqual({
        caloriesPerPortion: 0,
        proteinPerPortion: 0,
        fatPerPortion: 0,
        carbsPerPortion: 0,
      });
      return;
    }

    if (expectedProtein !== undefined) {
      expect(r.proteinPerPortion).toBeCloseTo(expectedProtein, PRECISION);
    }
  });

  /**
   * Округление
   */
  it.each([
    {
      title: "округление до 2 знаков",
      grams: 33.3333,
      digits: 2,
    },
  ])("$title", ({ grams, digits }) => {
    const r = computePortionKbju([createIngredient(grams)]);

    const rounded = Number(r.caloriesPerPortion.toFixed(digits));
    const expected = Number(scale(BASE.caloriesPer100g, grams).toFixed(digits));

    expect(rounded).toBeCloseTo(expected, digits);
  });

  /**
   * Корнер кейсы
   */
  it.each([
    {
      title: "отрицательные граммы",
      ingredients: [-100, 100],
    },
  ])("$title", ({ ingredients }) => {
    const r = computePortionKbju(ingredients.map((g) => createIngredient(g)));

    const expected = Number(scale(BASE.caloriesPer100g, GRAMS.NORMAL).toFixed(PRECISION));

    expect(r.caloriesPerPortion).toBeCloseTo(expected);
  });

  /**
   * Без данных
   */
  it("пустой массив", () => {
    const r = computePortionKbju([]);

    expect(r).toEqual({
      caloriesPerPortion: 0,
      proteinPerPortion: 0,
      fatPerPortion: 0,
      carbsPerPortion: 0,
    });
  });
});


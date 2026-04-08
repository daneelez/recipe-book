export type IngredientRow = {
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  grams: number;
};

/**
 * Утилита для расчета КБЖУ на порцию по составу блюда.
 *
 * Формула:
 * - caloriesPerPortion = sum(caloriesPer100g * grams / 100) - калории
 * - proteinPerPortion  = sum(proteinPer100g  * grams / 100) - белки
 * - fatPerPortion      = sum(fatPer100g      * grams / 100) - жиры
 * - carbsPerPortion    = sum(carbsPer100g    * grams / 100) - углеводы
 */
export function computePortionKbju(ingredients: IngredientRow[]): {
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbsPerPortion: number;
} {
  let caloriesPerPortion = 0;
  let proteinPerPortion = 0;
  let fatPerPortion = 0;
  let carbsPerPortion = 0;
  for (const ing of ingredients) {
    const k = ing.grams / 100;
    caloriesPerPortion += ing.caloriesPer100g * k;
    proteinPerPortion += ing.proteinPer100g * k;
    fatPerPortion += ing.fatPer100g * k;
    carbsPerPortion += ing.carbsPer100g * k;
  }
  return { caloriesPerPortion, proteinPerPortion, fatPerPortion, carbsPerPortion };
}


export type IngredientRow = {
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  grams: number;
};

/**
 * Computes dish nutrition values for a single portion using product KBJU per 100g.
 *
 * Formula (per requirements):
 * - caloriesPerPortion = Σ(caloriesPer100g * grams / 100)
 * - proteinPerPortion  = Σ(proteinPer100g  * grams / 100)
 * - fatPerPortion      = Σ(fatPer100g      * grams / 100)
 * - carbsPerPortion    = Σ(carbsPer100g    * grams / 100)
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


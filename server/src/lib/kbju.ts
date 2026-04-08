export type IngredientRow = {
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  grams: number;
};

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

/** Сумма БЖУ на 100 г блюда (для валидации) */
export function dishBjuSumPer100g(
  proteinPerPortion: number,
  fatPerPortion: number,
  carbsPerPortion: number,
  portionSizeG: number
): number {
  if (portionSizeG <= 0) return Infinity;
  const k = 100 / portionSizeG;
  return proteinPerPortion * k + fatPerPortion * k + carbsPerPortion * k;
}

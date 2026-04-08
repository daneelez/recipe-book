export type ProductCategory =
  | "FROZEN"
  | "MEAT"
  | "VEGETABLES"
  | "GREENS"
  | "SPICES"
  | "GRAINS"
  | "CANNED"
  | "LIQUID"
  | "SWEETS";

export type CookingNeed = "READY_TO_EAT" | "SEMI_FINISHED" | "REQUIRES_COOKING";

export type DishCategory =
  | "DESSERT"
  | "FIRST"
  | "SECOND"
  | "DRINK"
  | "SALAD"
  | "SOUP"
  | "SNACK";

export type FlagKey = "VEGAN" | "GLUTEN_FREE" | "SUGAR_FREE";

export type Product = {
  id: string;
  name: string;
  photos: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  composition: string | null;
  category: ProductCategory;
  categoryLabel: string;
  cookingNeed: CookingNeed;
  cookingNeedLabel: string;
  flags: FlagKey[];
  flagsLabels: string[];
  createdAt: string;
  updatedAt: string | null;
};

export type DishIngredient = {
  productId: string;
  grams: number;
  product: Product;
};

export type Dish = {
  id: string;
  name: string;
  photos: string[];
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbsPerPortion: number;
  portionSizeG: number;
  category: DishCategory;
  categoryLabel: string;
  flags: FlagKey[];
  flagsLabels: string[];
  ingredients: DishIngredient[];
  createdAt: string;
  updatedAt: string | null;
};

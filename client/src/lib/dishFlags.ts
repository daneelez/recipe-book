import type { FlagKey, Product } from "../types";

const ALL: FlagKey[] = ["VEGAN", "GLUTEN_FREE", "SUGAR_FREE"];

export function allowedDishFlagsFromProducts(products: Product[]): Set<FlagKey> {
  if (products.length === 0) return new Set();
  const allowed = new Set<FlagKey>();
  for (const key of ALL) {
    if (products.every((p) => p.flags.includes(key))) allowed.add(key);
  }
  return allowed;
}

export function sanitizeDishFlags(selected: FlagKey[], allowed: Set<FlagKey>): FlagKey[] {
  return selected.filter((f) => allowed.has(f));
}

import type { FlagKey } from "./enums.js";

const ALL_FLAGS: FlagKey[] = ["VEGAN", "GLUTEN_FREE", "SUGAR_FREE"];

export function parseFlagsJson(json: string): FlagKey[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is FlagKey => typeof x === "string" && ALL_FLAGS.includes(x as FlagKey));
  } catch {
    return [];
  }
}

export function serializeFlags(flags: FlagKey[]): string {
  const set = new Set(flags.filter((f) => ALL_FLAGS.includes(f)));
  return JSON.stringify([...set]);
}

export function normalizeProductFlagsForDish(
  ingredientFlags: FlagKey[][],
  requested: FlagKey[]
): FlagKey[] {
  const allowed = new Set<FlagKey>();
  for (const key of ALL_FLAGS) {
    if (ingredientFlags.length === 0) continue;
    const allHave = ingredientFlags.every((f) => f.includes(key));
    if (allHave) allowed.add(key);
  }
  return requested.filter((f) => allowed.has(f));
}

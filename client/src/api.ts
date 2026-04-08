import type { Dish, DishCategory, Product, ProductCategory } from "./types";

const json = async <T>(r: Response): Promise<T> => {
  const text = await r.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
};

export async function fetchProducts(params: Record<string, string | undefined>): Promise<Product[]> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, v);
  });
  const r = await fetch(`/api/products?${q}`);
  if (!r.ok) throw new Error("Не удалось загрузить продукты");
  return json<Product[]>(r);
}

export async function fetchProduct(id: string): Promise<Product> {
  const r = await fetch(`/api/products/${id}`);
  if (!r.ok) throw new Error("Продукт не найден");
  return json<Product>(r);
}

export async function saveProduct(
  id: string | undefined,
  body: {
    name: string;
    photos: string[];
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    carbsPer100g: number;
    composition: string | null;
    category: ProductCategory;
    cookingNeed: string;
    flags: string[];
  }
): Promise<Product> {
  const r = await fetch(id ? `/api/products/${id}` : "/api/products", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await json<{ error?: string } & Product>(r);
  if (!r.ok) throw new Error(data.error || "Ошибка сохранения");
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
  if (r.status === 204) return;
  const data = await json<{ error?: string; dishes?: { id: string; name: string }[] }>(r);
  const err = new Error(data.error || "Ошибка удаления") as Error & { dishes?: { id: string; name: string }[] };
  err.dishes = data.dishes;
  throw err;
}

export async function fetchDishes(params: Record<string, string | undefined>): Promise<Dish[]> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, v);
  });
  const r = await fetch(`/api/dishes?${q}`);
  if (!r.ok) throw new Error("Не удалось загрузить блюда");
  return json<Dish[]>(r);
}

export async function fetchDish(id: string): Promise<Dish> {
  const r = await fetch(`/api/dishes/${id}`);
  if (!r.ok) throw new Error("Блюдо не найдено");
  return json<Dish>(r);
}

export async function previewDishKbju(ingredients: { productId: string; grams: number }[]) {
  const r = await fetch("/api/dishes/preview-kbju", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  const data = await json<{ error?: string } & Record<string, number>>(r);
  if (!r.ok) throw new Error(data.error || "Ошибка расчёта");
  return data;
}

export async function saveDish(
  id: string | undefined,
  body: {
    name: string;
    photos: string[];
    caloriesPerPortion: number;
    proteinPerPortion: number;
    fatPerPortion: number;
    carbsPerPortion: number;
    portionSizeG: number;
    category: DishCategory;
    flags: string[];
    ingredients: { productId: string; grams: number }[];
  }
): Promise<Dish> {
  const r = await fetch(id ? `/api/dishes/${id}` : "/api/dishes", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await json<{ error?: string } & Dish>(r);
  if (!r.ok) throw new Error(data.error || "Ошибка сохранения");
  return data as Dish;
}

export async function deleteDish(id: string): Promise<void> {
  const r = await fetch(`/api/dishes/${id}`, { method: "DELETE" });
  if (!r.ok) {
    const data = await json<{ error?: string }>(r);
    throw new Error(data.error || "Ошибка удаления");
  }
}

export async function uploadPhotos(files: FileList | File[]): Promise<string[]> {
  const fd = new FormData();
  const arr = Array.from(files);
  arr.forEach((f) => fd.append("photos", f));
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await json<{ urls?: string[]; error?: string }>(r);
  if (!r.ok) throw new Error(data.error || "Загрузка не удалась");
  return data.urls ?? [];
}

import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { normalizeProductFlagsForDish, parseFlagsJson, serializeFlags } from "../lib/flags.js";
import type { FlagKey } from "../lib/enums.js";
import { extractDishMacro } from "../lib/macros.js";
import { computePortionKbju } from "../lib/kbju.js";
import { dishToDto, productToDto } from "../lib/serialize.js";
import { dishCreateSchema, ValidationError } from "../lib/validation.js";

export const dishesRouter = Router();

dishesRouter.post("/preview-kbju", async (req, res, next) => {
  try {
    const raw = req.body?.ingredients as { productId: string; grams: number }[] | undefined;
    if (!Array.isArray(raw) || raw.length === 0) {
      res.status(400).json({ error: "Укажите состав (ингредиенты)" });
      return;
    }
    const merged = new Map<string, number>();
    for (const ing of raw) {
      merged.set(ing.productId, (merged.get(ing.productId) ?? 0) + ing.grams);
    }
    const ingredients = [...merged.entries()].map(([productId, grams]) => ({ productId, grams }));
    const ids = [...merged.keys()];
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    const rows = ingredients.map((ing) => {
      const p = byId.get(ing.productId);
      if (!p) throw new ValidationError(`Продукт не найден: ${ing.productId}`);
      return {
        caloriesPer100g: p.caloriesPer100g,
        proteinPer100g: p.proteinPer100g,
        fatPer100g: p.fatPer100g,
        carbsPer100g: p.carbsPer100g,
        grams: ing.grams,
      };
    });
    res.json(computePortionKbju(rows));
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

dishesRouter.get("/", async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const vegan = req.query.vegan === "true" || req.query.vegan === "1";
    const glutenFree = req.query.glutenFree === "true" || req.query.glutenFree === "1";
    const sugarFree = req.query.sugarFree === "true" || req.query.sugarFree === "1";
    const search = (req.query.search as string | undefined)?.trim() ?? "";

    const where: Prisma.DishWhereInput = {};
    if (category) where.category = category as Prisma.DishWhereInput["category"];

    let rows = await prisma.dish.findMany({ where, include: { ingredients: { include: { product: true } } } });

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((d) => d.name.toLowerCase().includes(q));
    }

    if (vegan || glutenFree || sugarFree) {
      rows = rows.filter((d) => {
        const flags = new Set(parseFlagsJson(d.flagsJson) as FlagKey[]);
        if (vegan && !flags.has("VEGAN")) return false;
        if (glutenFree && !flags.has("GLUTEN_FREE")) return false;
        if (sugarFree && !flags.has("SUGAR_FREE")) return false;
        return true;
      });
    }

    res.json(
      rows.map((d) =>
        dishToDto(
          d,
          d.ingredients.map((i) => ({
            productId: i.productId,
            grams: i.grams,
            product: productToDto(i.product),
          }))
        )
      )
    );
  } catch (e) {
    next(e);
  }
});

async function buildDishPayload(body: unknown) {
  const parsed = dishCreateSchema.parse(body);
  const { cleanName } = extractDishMacro(parsed.name);
  const finalName = cleanName.trim();
  if (finalName.length < 2) {
    throw new ValidationError("Название должно быть не короче 2 символов после удаления макроса из названия.");
  }

  const merged = new Map<string, number>();
  for (const ing of parsed.ingredients) {
    merged.set(ing.productId, (merged.get(ing.productId) ?? 0) + ing.grams);
  }
  const mergedIngredients = [...merged.entries()].map(([productId, grams]) => ({ productId, grams }));

  const ids = [...merged.keys()];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  if (products.length !== ids.length) {
    throw new ValidationError("Один или несколько продуктов в составе не найдены");
  }
  const byId = new Map(products.map((p) => [p.id, p]));

  const ingredientFlags = mergedIngredients.map((ing) => parseFlagsJson(byId.get(ing.productId)!.flagsJson) as FlagKey[]);
  const flags = normalizeProductFlagsForDish(ingredientFlags, parsed.flags ?? []);

  return {
    parsed: { ...parsed, name: finalName, ingredients: mergedIngredients },
    flags,
    products,
    byId,
  };
}

dishesRouter.get("/:id", async (req, res, next) => {
  try {
    const d = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: { ingredients: { include: { product: true } } },
    });
    if (!d) {
      res.status(404).json({ error: "Блюдо не найдено" });
      return;
    }
    res.json(
      dishToDto(
        d,
        d.ingredients.map((i) => ({
          productId: i.productId,
          grams: i.grams,
          product: productToDto(i.product),
        }))
      )
    );
  } catch (e) {
    next(e);
  }
});

dishesRouter.post("/", async (req, res, next) => {
  try {
    const { parsed, flags } = await buildDishPayload(req.body);
    const d = await prisma.dish.create({
      data: {
        name: parsed.name,
        photosJson: JSON.stringify(parsed.photos ?? []),
        caloriesPerPortion: parsed.caloriesPerPortion,
        proteinPerPortion: parsed.proteinPerPortion,
        fatPerPortion: parsed.fatPerPortion,
        carbsPerPortion: parsed.carbsPerPortion,
        portionSizeG: parsed.portionSizeG,
        category: parsed.category,
        flagsJson: serializeFlags(flags),
        ingredients: {
          create: parsed.ingredients.map((i) => ({
            productId: i.productId,
            grams: i.grams,
          })),
        },
      },
      include: { ingredients: { include: { product: true } } },
    });
    res.status(201).json(
      dishToDto(
        d,
        d.ingredients.map((i) => ({
          productId: i.productId,
          grams: i.grams,
          product: productToDto(i.product),
        }))
      )
    );
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

dishesRouter.put("/:id", async (req, res, next) => {
  try {
    const { parsed, flags } = await buildDishPayload(req.body);
    const d = await prisma.dish.update({
      where: { id: req.params.id },
      data: {
        name: parsed.name,
        photosJson: JSON.stringify(parsed.photos ?? []),
        caloriesPerPortion: parsed.caloriesPerPortion,
        proteinPerPortion: parsed.proteinPerPortion,
        fatPerPortion: parsed.fatPerPortion,
        carbsPerPortion: parsed.carbsPerPortion,
        portionSizeG: parsed.portionSizeG,
        category: parsed.category,
        flagsJson: serializeFlags(flags),
        updatedAt: new Date(),
        ingredients: {
          deleteMany: {},
          create: parsed.ingredients.map((i) => ({
            productId: i.productId,
            grams: i.grams,
          })),
        },
      },
      include: { ingredients: { include: { product: true } } },
    });
    res.json(
      dishToDto(
        d,
        d.ingredients.map((i) => ({
          productId: i.productId,
          grams: i.grams,
          product: productToDto(i.product),
        }))
      )
    );
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2025") {
      res.status(404).json({ error: "Блюдо не найдено" });
      return;
    }
    if (e instanceof ValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

dishesRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.dish.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2025") {
      res.status(404).json({ error: "Блюдо не найдено" });
      return;
    }
    next(e);
  }
});

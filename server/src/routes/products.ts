import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma.js'
import { parseFlagsJson, serializeFlags } from '../lib/flags.js'
import type { FlagKey } from '../lib/enums.js'
import { productToDto } from '../lib/serialize.js'
import {
  assertProductBjuSum,
  productCreateSchema,
  ValidationError,
} from '../lib/validation.js'

export const productsRouter = Router();

const sortFields = ["name", "calories", "protein", "fat", "carbs"] as const;

function matchesFlags(flagsJson: string, vegan?: boolean, glutenFree?: boolean, sugarFree?: boolean): boolean {
  const flags = new Set(parseFlagsJson(flagsJson) as FlagKey[]);
  if (vegan && !flags.has("VEGAN")) return false;
  if (glutenFree && !flags.has("GLUTEN_FREE")) return false;
  if (sugarFree && !flags.has("SUGAR_FREE")) return false;
  return true;
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const cookingNeed = req.query.cookingNeed as string | undefined;
    const vegan = req.query.vegan === "true" || req.query.vegan === "1";
    const glutenFree = req.query.glutenFree === "true" || req.query.glutenFree === "1";
    const sugarFree = req.query.sugarFree === "true" || req.query.sugarFree === "1";
    const search = (req.query.search as string | undefined)?.trim() ?? "";
    const sort = (req.query.sort as (typeof sortFields)[number]) || "name";
    const order = req.query.order === "desc" ? "desc" : "asc";

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category as Prisma.ProductWhereInput["category"];
    if (cookingNeed) where.cookingNeed = cookingNeed as Prisma.ProductWhereInput["cookingNeed"];

    let rows = await prisma.product.findMany({ where });

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (vegan || glutenFree || sugarFree) {
      rows = rows.filter((p) => matchesFlags(p.flagsJson, vegan || undefined, glutenFree || undefined, sugarFree || undefined));
    }

    const dir = order === "desc" ? -1 : 1;
    rows.sort((a, b) => {
      switch (sort) {
        case "calories":
          return (a.caloriesPer100g - b.caloriesPer100g) * dir;
        case "protein":
          return (a.proteinPer100g - b.proteinPer100g) * dir;
        case "fat":
          return (a.fatPer100g - b.fatPer100g) * dir;
        case "carbs":
          return (a.carbsPer100g - b.carbsPer100g) * dir;
        case "name":
        default:
          return a.name.localeCompare(b.name, "ru") * dir;
      }
    });

    res.json(rows.map(productToDto));
  } catch (e) {
    next(e);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!p) {
      res.status(404).json({ error: "Продукт не найден" });
      return;
    }
    res.json(productToDto(p));
  } catch (e) {
    next(e);
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = productCreateSchema.parse(req.body);
    assertProductBjuSum(parsed);
    const p = await prisma.product.create({
      data: {
        name: parsed.name.trim(),
        photosJson: JSON.stringify(parsed.photos ?? []),
        caloriesPer100g: parsed.caloriesPer100g,
        proteinPer100g: parsed.proteinPer100g,
        fatPer100g: parsed.fatPer100g,
        carbsPer100g: parsed.carbsPer100g,
        composition: parsed.composition ?? null,
        category: parsed.category,
        cookingNeed: parsed.cookingNeed,
        flagsJson: serializeFlags(parsed.flags ?? []),
      },
    });
    res.status(201).json(productToDto(p));
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

productsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = productCreateSchema.parse(req.body);
    assertProductBjuSum(parsed);
    const p = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: parsed.name.trim(),
        photosJson: JSON.stringify(parsed.photos ?? []),
        caloriesPer100g: parsed.caloriesPer100g,
        proteinPer100g: parsed.proteinPer100g,
        fatPer100g: parsed.fatPer100g,
        carbsPer100g: parsed.carbsPer100g,
        composition: parsed.composition ?? null,
        category: parsed.category,
        cookingNeed: parsed.cookingNeed,
        flagsJson: serializeFlags(parsed.flags ?? []),
        updatedAt: new Date(),
      },
    });
    res.json(productToDto(p));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2025") {
      res.status(404).json({ error: "Продукт не найден" });
      return;
    }
    if (e instanceof ValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const usages = await prisma.dishIngredient.findMany({
      where: { productId: req.params.id },
      include: { dish: { select: { id: true, name: true } } },
    });
    if (usages.length > 0) {
      const dishes = [...new Map(usages.map((u) => [u.dish.id, u.dish])).values()];
      res.status(409).json({
        error: "Нельзя удалить продукт: он используется в блюдах",
        dishes: dishes.map((d) => ({ id: d.id, name: d.name })),
      });
      return;
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2025") {
      res.status(404).json({ error: "Продукт не найден" });
      return;
    }
    next(e);
  }
});

productsRouter.get("/test/forTestsOnly", async (req, res, next) => {
  try {
    await prisma.dishIngredient.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.product.deleteMany();
    } catch (e: unknown) {
    next(e);
  }
});

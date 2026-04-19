import { beforeEach, describe, expect, it } from 'vitest'
import { api, buildDish, createProduct } from './config.js'
import { prisma } from '../prisma.js'

describe("Dishes API", () => {
  beforeEach(async () => {
    await prisma.dishIngredient.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.product.deleteMany();
  });

  describe("POST /api/dishes", () => {
    it("Корректно создает блюдо", async () => {
      const payload = await buildDish();

      const res = await api.post("/api/dishes").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.ingredients).toHaveLength(1);
    });

    it("Удаляет макрос из названия", async () => {
      const payload = await buildDish({
        name: "Салат !десерт",
      });

      const res = await api.post("/api/dishes").send(payload);

      expect(res.body.name).toBe("Салат");
    });

    it("Соединяет одинаковые ингредиенты", async () => {
      const product = (await createProduct()).body;

      const payload = await buildDish({
        ingredients: [
          { productId: product.id, grams: 100 },
          { productId: product.id, grams: 50 },
        ],
      });

      const res = await api.post("/api/dishes").send(payload);

      expect(res.body.ingredients).toHaveLength(1);
      expect(res.body.ingredients[0].grams).toBe(150);
    });

    it("Возвращает 400, если продукт не найден", async () => {
      const payload = await buildDish({
        ingredients: [{ productId: "тест", grams: 100 }],
      });

      const res = await api.post("/api/dishes").send(payload);

      expect(res.status).toBe(400);
    });

    it("Валидирует БЖУ > грамм порции", async () => {
      const payload = await buildDish({
        proteinPerPortion: 100,
        fatPerPortion: 100,
      });

      const res = await api.post("/api/dishes").send(payload);

      expect(res.status).toBe(400);
    });

    it("Запрещает короткое имя после удаления макроса", async () => {
      const payload = await buildDish({
        name: "!салат а",
      });

      const res = await api.post("/api/dishes").send(payload);

      console.log(res);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/dishes", () => {
    it("Возвращает список блюд", async () => {
      await api.post("/api/dishes").send(await buildDish({ name: "AA" }));
      await api.post("/api/dishes").send(await buildDish({ name: "BB" }));

      const res = await api.get("/api/dishes");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("Фильтрует по названию", async () => {
      await api.post("/api/dishes").send(await buildDish({ name: "салат" }));
      await api.post("/api/dishes").send(await buildDish({ name: "суп" }));

      const res = await api.get("/api/dishes?search=сал");

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('салат')
    });

    it("Фильтрует по флагам", async () => {
      const veganProduct = (await createProduct({ flags: ["VEGAN"] })).body;

      const payload = {
        ...(await buildDish({flags: ["VEGAN"]})),
        ingredients: [{ productId: veganProduct.id, grams: 100 }],
      };

      const withoutFlag = {
        ...(await buildDish()),
        ingredients: [{ productId: veganProduct.id, grams: 100 }],
      };

      await api.post("/api/dishes").send(payload);
      await api.post("/api/dishes").send(withoutFlag);

      const res = await api.get("/api/dishes?vegan=true");

      expect(res.body).toHaveLength(1);
    });
  });

  describe("GET /api/dishes/:id", () => {
    it("Возвращает блюдо", async () => {
      const create = await api.post("/api/dishes").send(await buildDish());

      const res = await api.get(`/api/dishes/${create.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(create.body.id);
    });

    it("Возвращает 404, если блюдо не найдено", async () => {
      const res = await api.get("/api/dishes/unknown");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/dishes/:id", () => {
    it("Обновляет блюдо", async () => {
      const create = await api.post("/api/dishes").send(await buildDish());

      const updated = await buildDish({ name: "Новое блюдо" });

      const res = await api
        .put(`/api/dishes/${create.body.id}`)
        .send(updated);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Новое блюдо");
    });

    it("Возвращает 404, если блюдо не найдено", async () => {
      const res = await api
        .put("/api/dishes/unknown")
        .send(await buildDish());

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/dishes/:id", () => {
    it("Удаляет блюдо", async () => {
      const create = await api.post("/api/dishes").send(await buildDish());

      const res = await api.delete(`/api/dishes/${create.body.id}`);

      expect(res.status).toBe(204);
    });

    it("Возвращает 404, если блюдо не найдено", async () => {
      const res = await api.delete("/api/dishes/unknown");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/dishes/preview-kbju", () => {
    it("Считает КБЖУ", async () => {
      const product = (await createProduct({
        caloriesPer100g: 100,
      })).body;

      const res = await api.post("/api/dishes/preview-kbju").send({
        ingredients: [{ productId: product.id, grams: 100 }],
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        caloriesPerPortion: 100,
        proteinPerPortion: 10,
        fatPerPortion: 10,
        carbsPerPortion: 10
      });
    });

    it("Возвращает 400 без ингредиентов", async () => {
      const res = await api.post("/api/dishes/preview-kbju").send({});

      expect(res.status).toBe(400);
    });
  });
});
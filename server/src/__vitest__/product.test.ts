import { beforeEach, describe, expect, it } from 'vitest'
import { api, BASE, buildDish, buildProduct, createProduct } from './config.js'
import { prisma } from '../prisma.js'

describe("Products API", () => {
  beforeEach(async () => {
    await prisma.dishIngredient.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.product.deleteMany();
  });

  describe("POST /api/products", () => {
    it("Корректно создает продукт", async () => {
      const res = await createProduct()

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(BASE);
      expect(res.body.id).toBeDefined();
    });

    it("Корректно обрабатывает массив фото", async () => {
      const res = await createProduct({ photos: ['1', '2', '3', '4', '5'] });

      expect(res.body.photos).toStrictEqual([ '1', '2', '3', '4', '5' ]);
    });

    it("Корректно обрабатывает сумму БЖУ > 100", async () => {
      const res = await createProduct({
          proteinPer100g: 50,
          fatPer100g: 50,
          carbsPer100g: 10,
        })

      expect(res.status).toBe(400);
    });

    it("Запрещает создание продукта с массивом фото длины > 5", async () => {
      const res = await createProduct({ photos: ['1', '2', '3', '4', '5', '6'] });

      expect(res.status).toBe(400);
    });

    it("Запрещает создание продукта с неизвестной категорией", async () => {
      const res = await createProduct({ category: 'TEST' });

      expect(res.status).toBe(400);
    });

    it("Запрещает создание продукта с именем из < 2 символов", async () => {
      const res = await createProduct({ name: 'A' });

      expect(res.status).toBe(400);
    });

    it("Запрещает создание продукта с БЖУ < 0", async () => {
      const res = await createProduct({ fatPer100g: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/products", () => {
    it("Возвращает список продуктов", async () => {
      await createProduct({ name: "AA" });
      await createProduct({ name: "BB" });

      const res = await api.get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      const firstProductName = res.body[0].name;
      const secondProductName = res.body[1].name;

      expect(firstProductName).toBe('AA');
      expect(secondProductName).toBe('BB');
    });

    it("Корректно применяет фильтрацию по названию", async () => {
      await createProduct({ name: "яблоко" });
      await createProduct({ name: "банан" });

      const res = await api.get("/api/products?search=ябл");

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("яблоко");
    });

    it("Корректно применяет сортировку", async () => {
      await createProduct({ name: "яблоко" });
      await createProduct({ name: "банан" });

      const res = await api.get("/api/products?sort=name");

      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("банан");
    });

    it("Корректно применяет фильтрацию по флагам", async () => {
      await createProduct({ flags: ["VEGAN"] });
      await createProduct({ flags: [] });

      const res = await api.get("/api/products?vegan=true");

      expect(res.body).toHaveLength(1);
    });
  });

  describe("GET /api/products/:id", () => {
    it("Возвращает продукт", async () => {
      const create = await createProduct();

      const res = await api.get(`/api/products/${create.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(create.body.id);
      expect(res.body).toMatchObject(create.body);
    });

    it("Возвращает 404, если продукт не найден", async () => {
      const res = await api.get("/api/products/unknown");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("Правильно обновляет продукт", async () => {
      const create = await createProduct();

      const res = await api
        .put(`/api/products/${create.body.id}`)
        .send(buildProduct({ name: "Обновленный" }));

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Обновленный");
    });

    it("Возвращает 404, если продукт не найден", async () => {
      const res = await api
        .put("/api/products/unknown")
        .send(buildProduct());

      expect(res.status).toBe(404);
    });

    it("Валидирует БЖУ при обновлении", async () => {
      const create = await createProduct();

      const res = await api.put(`/api/products/${create.body.id}`).send(
        {
          proteinPer100g: 60,
          fatPer100g: 60,
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("Удаляет продукт", async () => {
      const create = await createProduct()

      const res = await api.delete(`/api/products/${create.body.id}`);

      expect(res.status).toBe(204);
    });

    it("Возвращает 404, если продукт не найден", async () => {
      const res = await api.delete("/api/products/unknown");

      expect(res.status).toBe(404);
    });

    it("Возвращает 409, если продукт используется в блюде", async () => {
      const product = (await createProduct()).body;

      const payload = await buildDish({
        ingredients: [ { productId: product.id, grams: 100 } ],
      });

      await api.post("/api/dishes").send(payload);

      const res = await api.delete(`/api/products/${product.id}`);

      expect(res.status).toBe(409);
    });
  });
});
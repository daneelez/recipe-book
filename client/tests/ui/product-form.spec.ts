import { expect, test } from './fixtures'
import { uniqueName } from './support/testData'

test.describe("Системные тесты формы продукта", () => {
  test("Создание продукта с корректными данными", async ({
                                                           page,
                                                           productFormPage,
                                                         }) => {
    const productName = uniqueName("продукт");

    await productFormPage.createProductViaUi({
      name: productName,
      calories: 120,
      protein: 20,
      fat: 30,
      carbs: 40,
      category: "VEGETABLES",
      cooking: "READY_TO_EAT",
    });

    await expect(page).toHaveURL(/\/products$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(productName);

    const row = page.locator("tr", { hasText: productName }).first();
    await expect(row).toBeVisible();

    await row.getByRole("link", { name: productName }).click();

    await expect(page).toHaveURL(/\/\/products\/.*\/view|\/products\/.*\/view/);
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText("120")).toBeVisible();
    await expect(page.getByText("20")).toBeVisible();
    await expect(page.getByText("30")).toBeVisible();
    await expect(page.getByText("40")).toBeVisible();
  });

  test.describe("Проверка границ названия", () => {
    const nameCases = [
      {
        title: "Ошибка при названии длиной 1 символ",
        name: "а",
        shouldFail: true,
      },
      {
        title: "Создание продукта при названии длиной 2 символа",
        name: "аб",
        shouldFail: false,
      },
    ] as const;

    for (const c of nameCases) {
      test(c.title, async ({ page, productFormPage }) => {
        const productName = c.shouldFail
          ? c.name
          : `${uniqueName("продукт")}-${c.name}`;

        await productFormPage.openNew();
        await productFormPage.fillBaseProduct(productName);
        await productFormPage.setBju(10, 10, 10);
        await productFormPage.submit();

        if (c.shouldFail) {
          await expect(productFormPage.errorMessage).toContainText(
            "Название не короче 2 символов"
          );
          await expect(page).toHaveURL(/\/products\/new$/);
        } else {
          await expect(page).toHaveURL(/\/products$/);

          await productFormPage.openList();
          await page.getByRole("textbox").first().fill(productName);

          await expect(
            page.locator("tr", { hasText: productName }).first()
          ).toBeVisible();
        }
      });
    }
  });

  test.describe("Проверка суммы БЖУ", () => {
    const bjuCases = [
      {
        title: "Создание продукта при сумме БЖУ равной 100",
        protein: 40,
        fat: 30,
        carbs: 30,
        shouldFail: false,
      },
      {
        title: "Ошибка при сумме БЖУ больше 100",
        protein: 40,
        fat: 30,
        carbs: 30.1,
        shouldFail: true,
      },
    ] as const;

    for (const c of bjuCases) {
      test(c.title, async ({ page, productFormPage }) => {
        const productName = uniqueName("бжу");

        await productFormPage.openNew();
        await productFormPage.fillBaseProduct(productName);
        await productFormPage.setBju(c.protein, c.fat, c.carbs);
        await productFormPage.submit();

        if (c.shouldFail) {
          await expect(productFormPage.errorMessage).toContainText(
            "Сумма БЖУ на 100 г не может превышать 100 г."
          );
          await expect(page).toHaveURL(/\/products\/new$/);
        } else {
          await expect(page).toHaveURL(/\/products$/);

          await productFormPage.openList();
          await page.getByRole("textbox").first().fill(productName);

          await expect(
            page.locator("tr", { hasText: productName }).first()
          ).toBeVisible();
        }
      });
    }
  });

  test("Редактирование существующего продукта", async ({
                                                         page,
                                                         productFormPage,
                                                       }) => {
    const oldName = uniqueName("старый-продукт");
    const newName = uniqueName("новый-продукт");

    await productFormPage.createProductViaUi({
      name: oldName,
      protein: 20,
      fat: 10,
      carbs: 20,
    });

    await expect(page).toHaveURL(/\/products$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(oldName);

    const row = page.locator("tr", { hasText: oldName }).first();
    await row.getByRole("link").nth(1).click();

    await productFormPage.nameInput.fill(newName);
    await productFormPage.submit();

    await expect(page).toHaveURL(/\/products$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(newName);

    const updatedRow = page.locator("tr", { hasText: newName }).first();
    await expect(updatedRow).toBeVisible();

    await updatedRow.getByRole("link", { name: newName }).click();
    await expect(page.getByText(newName)).toBeVisible();
  });

  test("Удаление существующего продукта", async ({
                                                   page,
                                                   productFormPage,
                                                 }) => {
    const productName = uniqueName("удаление-продукта");

    await productFormPage.createProductViaUi({
      name: productName,
    });

    await expect(page).toHaveURL(/\/products$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(productName);

    const row = page.locator("tr", { hasText: productName }).first();
    await row.getByRole("link").nth(1).click();

    await productFormPage.delete();

    await expect(page).toHaveURL(/\/products$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(productName);

    await expect(
      page.locator("tr", { hasText: productName })
    ).toHaveCount(0);
  });

  test("Ошибка удаления продукта, который используется в блюде", async ({
                                                                          page,
                                                                          productFormPage,
                                                                          dishFormPage,
                                                                        }) => {
    const productName = uniqueName("продукт-в-блюде");
    const dishName = uniqueName("блюдо-с-продуктом");

    await productFormPage.createProductViaUi({
      name: productName,
    });

    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.createDishViaUi({
      name: dishName,
      ingredientName: productName,
    });

    await expect(page).toHaveURL(/\/dishes$/);

    await productFormPage.openList();
    await page.getByRole("textbox").first().fill(productName);

    const row = page.locator("tr", { hasText: productName }).first();
    await row.getByRole("link").nth(1).click();

    await productFormPage.delete();

    await expect(productFormPage.deleteErrorMessage).toContainText(
      "Нельзя удалить продукт: он используется в блюдах"
    );

    await expect(page.getByRole("link", { name: dishName })).toBeVisible();
  });
});
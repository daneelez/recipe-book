import { expect, test } from './fixtures'
import { uniqueName } from './support/testData'

test.describe("Системные тесты формы блюда", () => {
  test("Создание блюда с корректными данными", async ({
                                                        productFormPage,
                                                        dishFormPage,
                                                        dishListPage,
                                                        dishCardPage,
                                                      }) => {
    const ingredientName = uniqueName("ingredient")
    const dishName = uniqueName("valid-dish")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.createDishViaUi({
      name: dishName,
      ingredientName,
      calories: 120,
      protein: 20,
      fat: 30,
      carbs: 40,
      portionSize: 200,
    })

    await expect(dishListPage.root).toBeVisible()

    await dishListPage.searchByName(dishName)
    await expect(dishListPage.rowByName(dishName)).toBeVisible()

    await dishListPage.itemLinkByName(dishName).click()

    await expect(dishCardPage.root).toBeVisible()
    await expect(dishCardPage.title).toContainText(dishName)
    await expect(dishCardPage.calories).toContainText("120")
    await expect(dishCardPage.protein).toContainText("20")
    await expect(dishCardPage.fat).toContainText("30")
    await expect(dishCardPage.carbs).toContainText("40")
    await expect(dishCardPage.portionSize).toContainText("200")
  })

  test("Ошибка при названии длиной 1 символ", async ({
                                                       productFormPage,
                                                       dishFormPage,
                                                     }) => {
    const ingredientName = uniqueName("ingredient")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.openNew()
    await dishFormPage.fillBaseDish("a ")
    await dishFormPage.selectIngredientByName(ingredientName)
    await dishFormPage.submit()

    await expect(dishFormPage.errorMessage).toContainText(
      "Название не короче 2 символов"
    )
    await expect(dishFormPage.root).toBeVisible()
  })

  test("Сохранение при БЖУ равном размеру порции", async ({
                                                            productFormPage,
                                                            dishFormPage,
                                                            dishListPage,
                                                            dishCardPage,
                                                          }) => {
    const ingredientName = uniqueName("ingredient")
    const dishName = uniqueName("boundary-dish")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.openNew()
    await dishFormPage.fillBaseDish(dishName)
    await dishFormPage.selectIngredientByName(ingredientName)
    await dishFormPage.portionSizeInput.fill("60")
    await dishFormPage.setBju(20, 20, 20)
    await dishFormPage.submit()

    await expect(dishListPage.root).toBeVisible()

    await dishListPage.searchByName(dishName)
    await dishListPage.itemLinkByName(dishName).click()

    await expect(dishCardPage.root).toBeVisible()
    await expect(dishCardPage.protein).toContainText("20")
    await expect(dishCardPage.fat).toContainText("20")
    await expect(dishCardPage.carbs).toContainText("20")
    await expect(dishCardPage.portionSize).toContainText("60")
  })

  test("Ошибка при БЖУ выше размера порции", async ({
                                                      productFormPage,
                                                      dishFormPage,
                                                    }) => {
    const ingredientName = uniqueName("ingredient")
    const dishName = uniqueName("boundary-dish")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.openNew()
    await dishFormPage.fillBaseDish(dishName)
    await dishFormPage.selectIngredientByName(ingredientName)
    await dishFormPage.portionSizeInput.fill("60")
    await dishFormPage.setBju(20, 20, 20.1)
    await dishFormPage.submit()

    await expect(dishFormPage.errorMessage).toContainText(
      "Нельзя сохранить: сумма Б+Ж+У на порцию не может превышать граммы порции."
    )
    await expect(dishFormPage.root).toBeVisible()
  })

  test("Удаление макроса из названия при сохранении", async ({
                                                               productFormPage,
                                                               dishFormPage,
                                                               dishListPage,
                                                             }) => {
    const ingredientName = uniqueName("ingredient")
    const rawName = `${uniqueName("salad")} !десерт`

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.createDishViaUi({
      name: rawName,
      ingredientName,
    })

    await expect(dishListPage.root).toBeVisible()

    await dishListPage.searchByName("salad")
    await expect(
      dishListPage.itemLinkByName("salad")
    ).not.toContainText("!десерт")
  })

  test("Фильтрация блюд по поиску и категории", async ({
                                                         productFormPage,
                                                         dishFormPage,
                                                         dishListPage,
                                                       }) => {
    const ingredientA = uniqueName("ing-a")
    const ingredientB = uniqueName("ing-b")
    const veganDish = uniqueName("салат")
    const nonVeganDish = uniqueName("суп")

    await productFormPage.createProductViaUi({
      name: ingredientA,
    })

    await productFormPage.createProductViaUi({
      name: ingredientB,
    })

    await dishFormPage.openNew()
    await dishFormPage.fillBaseDish(veganDish)
    await dishFormPage.categorySelect.selectOption("SALAD")
    await dishFormPage.selectIngredientByName(ingredientA)
    await dishFormPage.submit()

    await dishFormPage.openNew()
    await dishFormPage.fillBaseDish(nonVeganDish)
    await dishFormPage.categorySelect.selectOption("SOUP")
    await dishFormPage.selectIngredientByName(ingredientB)
    await dishFormPage.submit()

    await dishListPage.open()
    await dishListPage.searchByName("сал")

    await expect(dishListPage.itemLinkByName(veganDish)).toBeVisible()
    await expect(dishListPage.itemLinkByName(nonVeganDish)).toHaveCount(0)

    await dishListPage.searchByName("")
    await dishListPage.categorySelect.selectOption("SOUP")

    await expect(dishListPage.itemLinkByName(nonVeganDish)).toBeVisible()
    await expect(dishListPage.itemLinkByName(veganDish)).toHaveCount(0)
  })

  test("Редактирование существующего блюда", async ({
                                                      productFormPage,
                                                      dishFormPage,
                                                      dishListPage,
                                                      dishCardPage,
                                                    }) => {
    const ingredientName = uniqueName("ingredient")
    const createdName = uniqueName("dish-old")
    const updatedName = uniqueName("dish-new")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.createDishViaUi({
      name: createdName,
      ingredientName,
    })

    await dishListPage.open()
    await dishListPage.searchByName(createdName)
    await dishListPage.openEditByName(createdName)

    await dishFormPage.nameInput.fill(updatedName)
    await dishFormPage.submit()

    await expect(dishListPage.root).toBeVisible()

    await dishListPage.searchByName(updatedName)
    await expect(dishListPage.rowByName(updatedName)).toBeVisible()

    await dishListPage.itemLinkByName(updatedName).click()

    await expect(dishCardPage.root).toBeVisible()
    await expect(dishCardPage.title).toContainText(updatedName)
  })

  test("Удаление существующего блюда", async ({
                                                productFormPage,
                                                dishFormPage,
                                                dishListPage,
                                              }) => {
    const ingredientName = uniqueName("ingredient")
    const createdName = uniqueName("dish-delete")

    await productFormPage.createProductViaUi({
      name: ingredientName,
    })

    await dishFormPage.createDishViaUi({
      name: createdName,
      ingredientName,
    })

    await dishListPage.open()
    await dishListPage.searchByName(createdName)
    await dishListPage.openEditByName(createdName)

    await dishFormPage.deleteButton.click()

    await expect(dishListPage.root).toBeVisible()

    await dishListPage.searchByName(createdName)
    await expect(dishListPage.rowByName(createdName)).toHaveCount(0)
  })
})
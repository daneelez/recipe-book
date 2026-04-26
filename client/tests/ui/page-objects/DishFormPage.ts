import type { Locator, Page } from '@playwright/test'
import { qaSelectors } from '../support/selectors'

export class DishFormPage {
  readonly page: Page;

  readonly root: Locator;
  readonly nameInput: Locator;
  readonly portionSizeInput: Locator;
  readonly caloriesInput: Locator;
  readonly proteinInput: Locator;
  readonly fatInput: Locator;
  readonly carbsInput: Locator;
  readonly ingredientProductSelect: Locator;
  readonly ingredientGramsInput: Locator;
  readonly categorySelect: Locator;
  readonly addIngredientButton: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nameInput = page.locator(qaSelectors.dishForm.nameInput);
    this.root = page.locator(qaSelectors.dishForm.root);
    this.portionSizeInput = page.locator(qaSelectors.dishForm.portionSizeInput);
    this.caloriesInput = page.locator(qaSelectors.dishForm.caloriesInput);
    this.proteinInput = page.locator(qaSelectors.dishForm.proteinInput);
    this.fatInput = page.locator(qaSelectors.dishForm.fatInput);
    this.carbsInput = page.locator(qaSelectors.dishForm.carbsInput);
    this.ingredientProductSelect = page.locator(qaSelectors.dishForm.ingredientProductSelect);
    this.ingredientGramsInput = page.locator(qaSelectors.dishForm.ingredientGramsInput);
    this.categorySelect = page.locator(qaSelectors.dishForm.categorySelect);
    this.addIngredientButton = page.locator(qaSelectors.dishForm.addIngredientButton);
    this.saveButton = page.locator(qaSelectors.dishForm.saveButton);
    this.deleteButton = page.locator(qaSelectors.dishForm.deleteButton);
    this.errorMessage = page.locator(qaSelectors.dishForm.error);
  }

  async openNew(): Promise<void> {
    await this.page.goto("/dishes/new");
  }

  async openEdit(id: string): Promise<void> {
    await this.page.goto(`/dishes/${id}`);
  }

  async openView(id: string): Promise<void> {
    await this.page.goto(`/dishes/${id}/view`);
  }

  async openList(): Promise<void> {
    await this.page.goto("/dishes");
  }

  async fillBaseDish(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.categorySelect.selectOption("FIRST");
    await this.portionSizeInput.fill("300");
    await this.caloriesInput.fill("200");
    await this.setBju(20, 10, 30);
  }

  async setPortionSize(value: number): Promise<void> {
    await this.portionSizeInput.fill(String(value));
  }

  async setCalories(value: number): Promise<void> {
    await this.caloriesInput.fill(String(value));
  }

  async setBju(protein: number, fat: number, carbs: number): Promise<void> {
    await this.proteinInput.fill(String(protein));
    await this.fatInput.fill(String(fat));
    await this.carbsInput.fill(String(carbs));
  }

  async selectCategory(value: string): Promise<void> {
    await this.categorySelect.selectOption(value);
  }

  async setPrimaryIngredient(productName: string, grams = 100): Promise<void> {
    await this.ingredientProductSelect.selectOption({ label: productName });
    await this.ingredientGramsInput.fill(String(grams));
  }

  async selectIngredientByName(productName: string, grams = 100): Promise<void> {
    await this.setPrimaryIngredient(productName, grams);
  }

  async addIngredientRow(): Promise<void> {
    await this.addIngredientButton.click();
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async delete(): Promise<void> {
    await this.deleteButton.click();
  }

  async createDishViaUi(params: {
    name: string;
    ingredientName: string;
    ingredientGrams?: number;
    portionSize?: number;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    category?: string;
  }): Promise<void> {
    await this.openNew();
    await this.fillBaseDish(params.name);

    await this.setPortionSize(params.portionSize ?? 300);
    await this.setCalories(params.calories ?? 200);
    await this.setBju(
      params.protein ?? 20,
      params.fat ?? 10,
      params.carbs ?? 30,
    );

    if (params.category) {
      await this.selectCategory(params.category);
    }

    await this.setPrimaryIngredient(
      params.ingredientName,
      params.ingredientGrams ?? 100,
    );

    await this.submit();
  }
}

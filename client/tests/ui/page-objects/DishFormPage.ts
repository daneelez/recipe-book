import type { Locator, Page } from "@playwright/test";
import { qaSelectors } from "../support/selectors";

export class DishFormPage {
  readonly page: Page;
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

  async openList(): Promise<void> {
    await this.page.goto("/dishes");
  }

  async fillBaseDish(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.categorySelect.selectOption("FIRST");
    await this.portionSizeInput.fill("300");
    await this.caloriesInput.fill("200");
    await this.proteinInput.fill("20");
    await this.fatInput.fill("10");
    await this.carbsInput.fill("30");
  }

  async selectIngredientByName(name: string): Promise<void> {
    await this.ingredientProductSelect.selectOption({ label: name });
    await this.ingredientGramsInput.fill("100");
  }

  async setMacros(protein: number, fat: number, carbs: number): Promise<void> {
    await this.proteinInput.fill(String(protein));
    await this.fatInput.fill(String(fat));
    await this.carbsInput.fill(String(carbs));
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async createDishViaUi(params: {
    name: string;
    ingredientName: string;
    protein?: number;
    fat?: number;
    carbs?: number;
    portionSize?: number;
  }): Promise<void> {
    await this.openNew();
    await this.fillBaseDish(params.name);
    await this.selectIngredientByName(params.ingredientName);
    await this.portionSizeInput.fill(String(params.portionSize ?? 300));
    await this.setMacros(params.protein ?? 20, params.fat ?? 10, params.carbs ?? 20);
    await this.submit();
  }

}

import { Locator, Page } from '@playwright/test';

export class GoogleSearchPage {
  readonly searchField: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.searchField = page.locator('textarea[name="q"], input[name="q"]').first();
    this.searchButton = page.locator('input[name="btnK"]').first();
  }
}
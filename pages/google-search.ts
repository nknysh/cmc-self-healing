import { type Locator, type Page } from '@playwright/test';

export class GoogleSearchPage {
  readonly searchField: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.searchField = page
      .getByRole('textbox', { name: /search/i })
      .or(page.locator('textarea[name="q"], input[name="q"]'))
      .first();
    this.searchButton = page
      .getByRole('button', { name: /google search/i })
      .or(page.locator('input[name="btnK"]'))
      .first();
  }
}
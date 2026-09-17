import { Locator, Page } from '@playwright/test';

export class PlaywrightPage {
  readonly directMenuItems: Locator;
  readonly languageMenuItem: Locator;
  readonly languageDestinations: Locator;

  constructor(page: Page) {
    this.directMenuItems = page.locator(
      'nav[aria-label="Main"] a[href="/docs/intro"], ' +
      'nav[aria-label="Main"] a[href="/mcp/introduction"], ' +
      'nav[aria-label="Main"] a[href="/agent-cli/introduction"], ' +
      'nav[aria-label="Main"] a[href="/docs/api/class-playwright"]',
    );
    this.languageMenuItem = page.locator('nav[aria-label="Main"] a[aria-haspopup="true"]');
    this.languageDestinations = page.locator(
      'nav[aria-label="Main"] .dropdown__menu a.dropdown__link',
    );
  }
}
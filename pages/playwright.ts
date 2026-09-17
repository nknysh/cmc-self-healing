import { type Locator, type Page } from '@playwright/test';

export class PlaywrightPage {
  readonly directMenuItems: Locator;
  readonly languageMenuItem: Locator;
  readonly languageDestinations: Locator;

  constructor(page: Page) {
    const mainNavigation = page.getByRole('navigation', { name: 'Main' });
    this.directMenuItems = mainNavigation.getByRole('link', {
      name: /^(Docs|MCP|CLI|API)$/,
    });
    this.languageMenuItem = mainNavigation.locator('a[aria-haspopup="true"]');
    this.languageDestinations = page.locator(
      'nav[aria-label="Main"] .dropdown__menu a.dropdown__link',
    );
  }
}
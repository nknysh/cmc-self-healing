import { expect, test } from '@playwright/test';
import { PlaywrightPage } from '../pages/playwright';

test.describe('Playwright website navigation', () => {
  for (const [index, label] of ['Docs', 'MCP', 'CLI', 'API'].entries()) {
    test(`${label} navigation works`, async ({ page, request }) => {
      await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });
      const playwrightPage = new PlaywrightPage(page);
      const menuItem = playwrightPage.directMenuItems.nth(index);

      await expect(menuItem).toBeVisible();
      const href = await menuItem.getAttribute('href');
      expect(href).not.toBeNull();

      const response = await request.get(new URL(href!, 'https://playwright.dev').toString());
      expect(response.status(), `${label} menu item returned an error`).toBeLessThan(400);
    });
  }

  test('Node.js language navigation works', async ({ page, request }) => {
    await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });
    const playwrightPage = new PlaywrightPage(page);

    await expect(playwrightPage.languageMenuItem).toBeVisible();
    await playwrightPage.languageMenuItem.click();
    await expect(playwrightPage.languageDestinations).toHaveCount(4);

    for (const languageLink of await playwrightPage.languageDestinations.all()) {
      await expect(languageLink).toBeVisible();
      const label = (await languageLink.textContent())?.trim() ?? 'Language';
      const href = await languageLink.getAttribute('href');
      expect(href).not.toBeNull();

      const response = await request.get(new URL(href!, 'https://playwright.dev').toString());
      expect(response.status(), `${label} menu item returned an error`).toBeLessThan(400);
    }
  });
});

import { expect, test } from '@playwright/test';
import { PlaywrightPage } from '../pages/playwright';

function requireHref(label: string, href: string | null): string {
  if (!href) {
    throw new Error(`${label} menu item did not provide a destination.`);
  }

  return href;
}

test.describe('Playwright website navigation', () => {
  for (const label of ['Docs', 'MCP', 'CLI', 'API']) {
    test(`${label} navigation works`, async ({ page, request }) => {
      await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });
      const playwrightPage = new PlaywrightPage(page);
      const menuItem = playwrightPage.directMenuItems.filter({ hasText: label });

      await expect(menuItem).toBeVisible();
      const href = requireHref(label, await menuItem.getAttribute('href'));

      const response = await request.get(new URL(href, 'https://playwright.dev').toString());
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
      const href = requireHref(label, await languageLink.getAttribute('href'));

      const response = await request.get(new URL(href, 'https://playwright.dev').toString());
      expect(response.status(), `${label} menu item returned an error`).toBeLessThan(400);
    }
  });
});

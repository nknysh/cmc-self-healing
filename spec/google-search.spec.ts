import { test, expect } from '@playwright/test';
import { GoogleSearchPage } from '../pages/google-search';

test.describe('Google Search', () => {
  test('displays the search field', async ({ page }) => {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    const googleSearchPage = new GoogleSearchPage(page);

    await expect(googleSearchPage.searchField).toBeVisible();
  });

  test('accepts a search query', async ({ page }) => {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    const googleSearchPage = new GoogleSearchPage(page);

    await googleSearchPage.searchField.fill('Playwright');

    await expect(googleSearchPage.searchField).toHaveValue('Playwright');
  });

  test('submits a query with Enter', async ({ page }) => {
    await page.route('**/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>Search results</title>',
      });
    });
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    const googleSearchPage = new GoogleSearchPage(page);

    await googleSearchPage.searchField.fill('Playwright');
    await googleSearchPage.searchField.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=Playwright/i);
  });

  test('submits a query with the search button', async ({ page }) => {
    await page.route('**/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>Search results</title>',
      });
    });
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    const googleSearchPage = new GoogleSearchPage(page);

    await googleSearchPage.searchField.fill('Playwright');
    await googleSearchPage.searchButton.click();

    await expect(page).toHaveURL(/\/search\?q=Playwright/i);
  });
});

import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  projects: [
    {
      name: 'google-search',
      testMatch: 'spec/google-search.spec.ts',
    },
    {
      name: 'playwright-navigation',
      testMatch: 'spec/playwright.spec.ts',
    },
    {
      name: 'coinmarketcap-api',
      testMatch: 'spec/coinmarketcap-api.spec.ts',
    },
  ],
});
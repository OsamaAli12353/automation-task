import { defineConfig, devices } from '@playwright/test';

// Base URL is configurable: BASE_URL=https://other-site.example npx playwright test
const baseURL = process.env.BASE_URL ?? 'https://demo.nopcommerce.com';

export default defineConfig({
  testDir: './tests',
  // Each test gets its own browser context (Playwright default) => empty guest cart per test.
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2, // the public demo is shared, keep load low
  retries: 1, // absorbs demo-site hiccups; failures still keep trace/screenshot
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    locale: 'en-US',
    viewport: { width: 1366, height: 768 }, // desktop only (per scope)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

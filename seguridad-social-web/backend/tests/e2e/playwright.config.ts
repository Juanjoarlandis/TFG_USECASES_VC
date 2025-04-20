import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './backend/tests/e2e',
  timeout: 60 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    actionTimeout: 10 * 1000,
  },
});

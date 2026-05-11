const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 100000,
  expect: { timeout: 8000 },
  use: {
    baseURL: 'https://tdi-app.netlify.app',
    headless: true,
    permissions: ['notifications'],
  },
  reporter: [['list']],
});

const { defineConfig } = (() => {
  try {
    return require('@playwright/test');
  } catch (e) {
    // @ts-ignore
    return { defineConfig: (cfg) => cfg };
  }
})();

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'off',
  },
});
import fs from 'node:fs';
import { configDefaults, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

if (!process.env.CHROME_PATH) {
  const candidates = [
    '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (found) process.env.CHROME_PATH = found;
}

export default defineConfig({
  ...viteConfig,
  test: {
    include: ['src/__tests__/*.browser.test.tsx'],
    exclude: configDefaults.exclude,
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});

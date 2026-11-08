import { configDefaults, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

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

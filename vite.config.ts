import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

function inlineBinaryAssetsPlugin(): Plugin {
  return {
    name: 'xbrain-inline-binary-assets',
    enforce: 'pre',
    resolveId(source, importer) {
      const cleanSource = source.split('?')[0];
      const baseDir = importer ? path.dirname(importer.split('?')[0]) : import.meta.dirname;
      const resolved = path.resolve(baseDir, cleanSource);
      if (/[?&]raw(?:&|$)/.test(source)) {
        return `\0xbrain-raw:${resolved.replace(/\.css$/i, '__CSS_EXT__').replace(/\.svg$/i, '__SVG_EXT__')}`;
      }
      const imagesDir = path.resolve(import.meta.dirname, 'public/assets/images') + path.sep;
      if (resolved.startsWith(imagesDir) && /\.(?:jpe?g|png)$/i.test(resolved)) {
        return `\0xbrain-image:${resolved}`;
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0xbrain-raw:')) {
        const filePath = id
          .slice('\0xbrain-raw:'.length)
          .split('?')[0]
          .replace(/__CSS_EXT__$/, '.css')
          .replace(/__SVG_EXT__$/, '.svg');
        this.addWatchFile(filePath);
        const text = fs.readFileSync(filePath, 'utf8');
        return `export default ${JSON.stringify(text)};`;
      }
      if (!id.startsWith('\0xbrain-image:')) return null;
      const cleanId = id.slice('\0xbrain-image:'.length);
      this.addWatchFile(cleanId);
      const ext = path.extname(cleanId).toLowerCase();
      if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') return null;
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const base64 = fs.readFileSync(cleanId).toString('base64');
      return `export default "data:${mime};base64,${base64}";`;
    },
  };
}

export default defineConfig({
    root: process.env.VITEST ? import.meta.dirname : path.resolve(import.meta.dirname, 'public'),
    publicDir: false,
    base: './',
    plugins: [inlineBinaryAssetsPlugin(), react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        '/src': path.resolve(import.meta.dirname, 'src'),
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist'),
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      copyPublicDir: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    test: {
      exclude: [...configDefaults.exclude, '**/*.browser.test.tsx'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
});

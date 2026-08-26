import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;

/**
 * The stylesheet and its icons are plain static assets, not JS imports: consumers
 * pull them in via `ns-mapbox-gl-draw/dist/mapbox-gl-draw.css`. Copying them keeps
 * that entry point real without injecting a CSS import into the JS bundles, which
 * would break `require()` for CJS consumers.
 */
function copyStaticAssets(): Plugin {
  return {
    name: 'ns-draw-copy-static-assets',
    apply: 'build',
    closeBundle() {
      mkdirSync(resolve(root, 'dist'), { recursive: true });
      cpSync(
        resolve(root, 'src/mapbox-gl-draw.css'),
        resolve(root, 'dist/mapbox-gl-draw.css'),
      );
      cpSync(resolve(root, 'src/svg'), resolve(root, 'dist/svg'), { recursive: true });
    },
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: resolve(root, 'index.ts'),
      name: 'MapboxDraw',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'umd') return 'mapbox-gl-draw.umd.js';
        if (format === 'cjs') return 'mapbox-gl-draw.cjs';
        return 'mapbox-gl-draw.mjs';
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'oxc',
    rollupOptions: {
      external: ['mapbox-gl'],
      output: {
        globals: {
          'mapbox-gl': 'mapboxgl',
        },
        exports: 'named',
      },
    },
  },
  plugins: [
    dts({
      // Renamed from `rollupTypes` in vite-plugin-dts v5. Emits a single
      // self-contained dist/index.d.ts instead of a dist/src/** tree.
      bundleTypes: true,
      outDir: 'dist',
      include: ['index.ts', 'src/**/*.ts'],
    }),
    copyStaticAssets(),
  ],
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
});

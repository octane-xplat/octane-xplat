import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Node runs the font CLI without the application's Octane compiler.
// Component exports ship as authored source and are compiled by the app.
//
// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. This package's root tsconfig is a
// references-only solution points at the tracked xplat-typecheck/ programs;
// a stale or missing program still dangles and fails every transform. Pin the build
// transform to the package's committed env manifest.
export default defineConfig({
  tsconfig: fileURLToPath(new URL('./tsconfig.envs.json', import.meta.url)),
  build: {
    lib: {
      entry: ['src/build/index.ts', 'src/build/cli.ts'],
      formats: ['es'],
    },
    outDir: 'dist/build',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      external: [
        /^node:/,
        /^@iconify\//,
        '@xmldom/xmldom',
        'cubic2quad',
        'fonteditor-core',
        'pathkit-wasm',
        'svg2ttf',
      ],
    },
  },
})

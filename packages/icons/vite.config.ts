import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Node runs the bundler plugin without the application's Octane compiler,
// so it emits plain JS — published packages must not ship .ts for Node-side
// entries (no type stripping inside node_modules). Component exports keep
// shipping as authored source and are compiled by the app.
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
      entry: {
        'vite/index': 'src/vite/index.ts',
        'mapper/server': 'src/mapper/server.ts',
      },
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      external: [/^node:/, /^@iconify\//, 'vite'],
    },
  },
})

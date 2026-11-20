import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Vite loads workshop.config in Node, where installed TypeScript is not executable.
// App-facing exports remain source modules compiled by the consuming app; Node
// tooling lives in src/build/ (excluded from app typecheck sweeps) and emits to
// dist/build/. src/index.ts emits to dist/index.js for the `./` node condition.
//
// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. This package's root tsconfig is a
// references-only solution pointing at generated env programs under
// node_modules/.cache/xplat-typecheck — which exist only after a typecheck
// run — so every transform fails on an ungenerated checkout. Pin the build
// transform to the package's committed env manifest.
export default defineConfig({
  tsconfig: fileURLToPath(new URL('./tsconfig.envs.json', import.meta.url)),
  build: {
    lib: {
      entry: [
        'src/index.ts',
        ...globSync('src/build/**/*.ts').filter(
          (f) =>
            !f.endsWith('.d.ts') &&
            !f.includes('.test.') &&
            !f.includes('native-catalog-vite') &&
            !f.includes('macos/shell') &&
            !f.includes('gtk/shell'),
        ),
      ],
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      treeshake: false,
      external: (id) =>
        id.startsWith('node:') ||
        (!id.startsWith('.') && !id.startsWith('/') && !id.endsWith('.ts')),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})

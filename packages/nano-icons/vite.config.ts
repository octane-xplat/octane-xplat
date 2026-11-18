import { defineConfig } from 'vite'

// Node runs the font CLI without the application's Octane compiler.
// Component exports ship as authored source and are compiled by the app.
//
// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. This package's root tsconfig is a
// references-only solution pointing at generated env programs under
// node_modules/.cache/xplat-typecheck — which exist only after a typecheck
// run — so every transform fails on an ungenerated checkout. Pin the build
// transform to the package's committed env manifest.
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
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

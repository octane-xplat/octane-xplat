import { build } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
const require = createRequire(import.meta.url)
const runtime = require.resolve('octane/universal/native')
for (const engine of ['native', 'gjs']) {
  await build({
    root: import.meta.dirname,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [
      octane({
        hmr: false,
        renderers: {
          default: 'probe',
          registry: {
            probe: {
              module: '/driver.mjs',
              target: 'universal',
              server: 'unsupported',
              text: 'host',
              intrinsics: '@octane-xplat/jsx',
            },
          },
          rules: [{ include: '**/*.tsx', renderer: 'probe' }],
        },
      }),
    ],
    resolve: {
      alias: [
        { find: '#gtk-api', replacement: resolve(import.meta.dirname, `gtk-${engine}.mjs`) },
        { find: /^octane$/, replacement: runtime },
        { find: /^octane\/universal\/native$/, replacement: runtime },
      ],
    },
    build: {
      outDir: `dist/${engine}`,
      minify: false,
      lib: {
        entry: resolve(import.meta.dirname, 'main.mjs'),
        formats: ['es'],
        fileName: () => 'slice.js',
      },
      rollupOptions: {
        external: (id) => id.startsWith('gi://'),
        output: { inlineDynamicImports: true },
      },
    },
  })
}

import { tsrx } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vitest/config'
import { existsSync } from 'node:fs'
import { URL } from 'node:url'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@octane-xplat/nativescript-octane/config'

// Universal-renderer tests — same suffix chain + octane alias as the native
// build, so leaves compile under the nativescript renderer and 'octane'
// resolves to octane/universal/native. Tests drive the runtime through the
// object driver (no @nativescript/core needed). `ssr: false` pins client
// compilation — vitest transforms through the SSR pipeline by default and
// the nativescript renderer is server:'unsupported'. The app-level
// @octanejs/vite-plugin wrapper doesn't forward this flag, so tests use the
// compiler plugin directly.
const NATIVE_EXTS = [
  '.ios.tsrx',
  '.android.tsrx',
  '.mobile.tsrx',
  '.tsrx',
  '.ios.tsx',
  '.android.tsx',
  '.mobile.tsx',
  '.tsx',
  '.ios.ts',
  '.android.ts',
  '.mobile.ts',
  '.mjs',
  '.mts',
  '.ts',
  '.jsx',
  '.js',
  '.json',
]

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. Packages whose root tsconfig is a
// references-only solution points at the tracked xplat-typecheck/ programs;
// a stale or missing program still dangles and fails every transform. Pin the test
// transform to the package's committed env manifest (or its declaration
// config when the package has no root tsconfig at all, which also covers
// cross-package imports into references-style packages) so loading the
// suite never depends on generated typecheck state.
const packageFile = (name) => new URL(`./${name}`, import.meta.url).pathname
const testTsconfig = existsSync(packageFile('tsconfig.envs.json'))
  ? packageFile('tsconfig.envs.json')
  : existsSync(packageFile('tsconfig.types.json'))
    ? packageFile('tsconfig.types.json')
    : undefined

export default defineConfig({
  ...(testTsconfig ? { tsconfig: testTsconfig } : {}),
  plugins: [
    tsrx('ios'),
    octane({
      ssr: false,
      renderers: {
        registry: { nativescript: nativeScriptRenderer },
        rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
      },
    }),
  ],
  resolve: {
    conditions: ['native'],
    alias: [
      { find: /^octane$/, replacement: 'octane/universal/native' },
      // Vitest's SSR resolver otherwise redirects the authored client hook
      // module to signals/server, despite client universal compilation.
      {
        find: /^octane\/signals\/client$/,
        replacement: new URL('./node_modules/octane/dist/node/signals/client.js', import.meta.url)
          .pathname,
      },
      // Compiled leaves import the renderer module (the driver package),
      // whose index pulls @nativescript/core — not loadable in node.
      // Object-driver tests only need its universal-runtime re-exports.
      {
        find: /^@octane-xplat\/nativescript-octane$/,
        replacement: 'octane/universal/native',
      },
    ],
    extensions: NATIVE_EXTS,
  },
  test: {
    include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'],
    environment: 'node',
  },
})

import { tsrx } from '@octane-xplat/cli/vite'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@octane-xplat/nativescript-octane/config'

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

const configDir = dirname(fileURLToPath(import.meta.url))

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. Packages whose root tsconfig is a
// references-only solution points at the tracked xplat-typecheck/ programs;
// a stale or missing program still dangles and fails every transform. Pin the test
// transform to the package's committed env manifest (or its declaration
// config when the package has no root tsconfig at all, which also covers
// cross-package imports into references-style packages) so loading the
// suite never depends on generated typecheck state.
const packageFile = (name) => join(configDir, name)
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
      { find: './clock', replacement: resolve(configDir, 'test/platform.ts') },
      { find: '../clock', replacement: resolve(configDir, 'test/platform.ts') },
      { find: './reduced-motion', replacement: resolve(configDir, 'test/platform.ts') },
      { find: /^@nativescript\/core$/, replacement: resolve(configDir, 'test/platform.ts') },
      {
        find: /^@nativescript-community\/gesturehandler$/,
        replacement: resolve(configDir, 'test/gesturehandler.ts'),
      },
      { find: /^octane$/, replacement: 'octane/universal/native' },
      { find: /^@octane-xplat\/nativescript-octane$/, replacement: 'octane/universal/native' },
    ],
    extensions: NATIVE_EXTS,
  },
  test: { maxWorkers: 2, include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'], environment: 'node' },
})

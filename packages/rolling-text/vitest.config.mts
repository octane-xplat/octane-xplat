import { tsrx } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. The root config's generated env programs
// exist only after `xplat typecheck` runs — pin the test transform to the
// committed env manifest so the suite never depends on generated state.
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  plugins: [tsrx('web'), octane({ ssr: false })],
  resolve: {
    conditions: ['web'],
    extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
  },
  test: {
    include: ['src/**/*.test.{ts,tsrx}'],
    exclude: ['**/*.mobile.test.*'],
    environment: 'jsdom',
  },
})

import { tsrx } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'

export default defineConfig({
  plugins: [tsrx('web'), octane({ ssr: false })],
  resolve: {
    conditions: ['web'],
    extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
  },
  test: {
    // Turbo runs package suites together; keep their worker pools bounded.
    maxWorkers: 2,
    include: ['src/**/*.web.test.{ts,tsrx}'],
    exclude: [],
    environment: 'jsdom',
  },
})

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
    include: ['src/**/*.test.{ts,tsrx}'],
    setupFiles: ['./test/geometry.web.ts'],
    maxWorkers: 2,
    exclude: ['**/*.mobile.test.*'],
    environment: 'jsdom',
  },
})

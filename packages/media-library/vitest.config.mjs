import { xplatTsrx } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
export default defineConfig({
  plugins: [xplatTsrx('web'), octane({ ssr: false })],
  test: {
    include: ['tests/*.test.{ts,tsx}'],
    maxWorkers: 2,
    environment: 'node',
    environmentOptions: { jsdom: { pretendToBeVisual: true } },
  },
})

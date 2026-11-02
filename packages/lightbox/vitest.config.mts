import { xplatTsrx } from '@octane-xplat/cli/vite'
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'

export default defineConfig({
	plugins: [xplatTsrx('web'), octane({ ssr: false })],
	resolve: {
		conditions: ['web'],
		extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.mts', '.js', '.json'],
	},
	test: {
		maxWorkers: 2,
		include: ['src/**/*.test.{ts,tsrx}'],
		exclude: ['**/*.mobile.test.*'],
		environment: 'jsdom',
	},
})

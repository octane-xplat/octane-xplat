import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
export default defineConfig({
	plugins: [octane({ ssr: false })],
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

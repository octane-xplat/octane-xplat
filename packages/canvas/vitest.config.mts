import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'

// Web-condition resolution so Canvas.web.tsrx resolves.
export default defineConfig({
	plugins: [octane({ ssr: false })],
	resolve: {
		conditions: ['web'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.ts',
			'.web.tsx',
			'.ts',
			'.tsx',
			'.mjs',
			'.js',
			'.json',
		],
	},
	test: {
		include: ['src/**/*.test.{ts,tsx,tsrx}'],
		environment: 'jsdom',
	},
})

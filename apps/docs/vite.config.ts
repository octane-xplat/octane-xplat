import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'

export default defineConfig({
	plugins: [...octane()],
	server: { port: 5300 },
	resolve: {
		conditions: ['web'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.mjs',
			'.mts',
			'.ts',
			'.jsx',
			'.js',
			'.json',
		],
	},
})

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'

export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	plugins: [...octane()],
	resolve: {
		conditions: ['web'],
		dedupe: ['octane'],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.ts',
			'.mjs',
			'.js',
			'.json',
		],
	},
})

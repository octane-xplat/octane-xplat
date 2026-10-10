import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Builds the WebKitGTK conformance harness with the real Linux resolution
// chain (.linux → .web → unsuffixed), so session-backend.linux.ts is the
// adapter under test — the same leaves a packaged Linux app ships.
export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
	resolve: {
		conditions: ['linux', 'web'],
		extensions: [
			'.linux.tsrx',
			'.web.tsrx',
			'.tsrx',
			'.linux.tsx',
			'.web.tsx',
			'.tsx',
			'.linux.ts',
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

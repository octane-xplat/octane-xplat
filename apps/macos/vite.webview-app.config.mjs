import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./webview-app/', import.meta.url))

export default defineConfig(({ mode }) => ({
	root,
	base: './',
	plugins: [...octane(), xplatBoundary('web')],
	define: xplatNodeEnvDefine(mode),
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
	build: {
		outDir: '../dist/webview-app',
		emptyOutDir: true,
	},
}))

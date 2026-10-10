import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'
import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
	root: resolve(appRoot, 'webview-camera-proof'),
	base: './',
	plugins: [...octane(), xplatBoundary('web')],
	define: xplatNodeEnvDefine(mode),
	server: {
		host: '127.0.0.1',
		port: 0,
		strictPort: false,
		hmr: false,
	},
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
		outDir: resolve(appRoot, 'dist/webview-camera-proof'),
		emptyOutDir: true,
	},
}))

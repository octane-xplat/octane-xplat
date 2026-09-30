import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundledFontDefines } from './vite.shared.mjs'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	root: appRoot,
	define: bundledFontDefines(),
	build: {
		outDir: resolve(appRoot, 'dist/webview-app-host'),
		emptyOutDir: true,
		lib: {
			entry: resolve(appRoot, 'webview-app-host.ts'),
			formats: ['cjs'],
			fileName: 'host',
		},
		rollupOptions: {
			external: ['@nativescript/macos-node-api', /^node:/],
		},
	},
})

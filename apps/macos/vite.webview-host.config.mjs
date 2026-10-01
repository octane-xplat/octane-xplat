import { defineConfig } from 'vite'
import { xplatNodeEnvDefine } from '@octane-xplat/cli/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundledFontDefines } from './vite.shared.mjs'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
	root: appRoot,
	define: { ...xplatNodeEnvDefine(mode), ...bundledFontDefines() },
	build: {
		outDir: resolve(appRoot, 'dist/webview-host'),
		emptyOutDir: true,
		lib: {
			entry: resolve(appRoot, 'webview-proof-host.ts'),
			formats: ['cjs'],
			fileName: 'host',
		},
		rollupOptions: {
			external: ['@nativescript/macos-node-api', /^node:/],
		},
	},
}))

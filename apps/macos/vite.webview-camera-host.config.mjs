import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundledFontDefines } from './vite.shared.mjs'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ mode }) => {
	const config = await xplatMacOS(mode, {
		root: appRoot,
		entry: resolve(appRoot, 'webview-camera-proof-host.ts'),
		outDir: resolve(appRoot, 'dist/webview-camera-host'),
	})
	return {
		...config,
		define: { ...config.define, ...bundledFontDefines() },
		build: {
			...config.build,
			lib: { ...config.build.lib, fileName: 'host' },
		},
	}
})

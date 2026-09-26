import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))

export function createMacOSConfig({ packaged = false, hmr = false } = {}) {
	const rendererId = 'macos'
	const nativeRuntime = '@nativescript/macos-node-api'

	return defineConfig({
		root: appRoot,
		plugins: [
			octane({
				hmr,
				renderers: {
					registry: {
						[rendererId]: {
							module: '@xplat/macos/renderer',
							target: 'universal',
							server: 'unsupported',
							intrinsics: '@xplat/macos/renderer/intrinsics',
						},
					},
					rules: [{ include: 'src/**/*.{tsx,tsrx}', renderer: rendererId }],
				},
			}),
		],
		build: {
			outDir: packaged ? 'dist/package-build' : 'dist',
			lib: {
				entry: packaged ? 'src/main.mjs' : 'src/App.tsx',
				formats: packaged ? ['cjs'] : ['es'],
				fileName: packaged ? 'main' : 'app',
			},
			rollupOptions: {
				external: packaged
					? [nativeRuntime]
					: [nativeRuntime, '@xplat/macos/renderer', /^octane(?:\/|$)/],
			},
		},
	})
}

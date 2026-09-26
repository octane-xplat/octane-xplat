import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'

export function createMacOSConfig({ packaged = false } = {}) {
	const rendererId = 'macos'
	const nativeRuntime = '@nativescript/macos-node-api'

	return defineConfig({
		plugins: [
			octane({
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
					: [nativeRuntime, '@xplat/macos/renderer', 'octane'],
			},
		},
	})
}

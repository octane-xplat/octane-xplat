import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'

const rendererId = 'macos'

export default defineConfig({
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
		lib: {
			entry: 'src/App.tsx',
			formats: ['es'],
			fileName: 'app',
		},
		rollupOptions: {
			external: ['@nativescript/macos-node-api', '@xplat/macos/renderer', 'octane'],
		},
	},
})

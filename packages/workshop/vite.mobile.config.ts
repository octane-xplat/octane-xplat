import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

export default defineConfig({
	plugins: octane({ renderers: {
		registry: { nativescript: nativeScriptRenderer },
		rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
	} }),
	resolve: { conditions: ['native'], extensions: ['.mobile.tsrx', '.tsrx', '.mobile.ts', '.ts', '.mjs', '.js', '.json'] },
	build: {
		lib: { entry: { index: 'src/mobile/index.mobile.ts' }, formats: ['es'] },
		outDir: 'dist/mobile', emptyOutDir: true, minify: false,
		rollupOptions: {
			external: [/^@nativescript(?:-community)?\//, /^@octane-xplat\//, /^octane(?:\/|$)/, /^storybook(?:\/|$)/],
			output: { preserveModules: true, paths: (id) => id === 'octane' ? 'octane/universal/native' : id },
		},
	},
})

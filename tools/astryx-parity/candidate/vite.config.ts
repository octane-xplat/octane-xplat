import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'

export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	plugins: [...octane()],
	resolve: {
		conditions: ['web'],
		dedupe: ['octane'],
		alias: [
			// Shared UI imports these names for native leaves; the web bundle
			// never executes them. Exact specifier only — deep nativescript
			// imports from other packages keep resolving normally.
			{
				find: /^@nativescript\/core$/,
				replacement: fileURLToPath(new URL('./nativescript-stub.ts', import.meta.url)),
			},
			// packages/ui lacks a web/default leaf for the keyboard overlay
			// host (real upstream gap); stub so the barrel resolves.
			{
				find: /.*internal\/keyboard\/keyboard-overlay-host$/,
				replacement: fileURLToPath(new URL('./keyboard-overlay-stub.ts', import.meta.url)),
			},
		],
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.ts',
			'.mjs',
			'.js',
			'.json',
		],
	},
})

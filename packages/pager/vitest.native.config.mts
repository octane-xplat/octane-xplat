import { defineConfig } from 'vitest/config'
import { URL } from 'node:url'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Universal-renderer tests — same suffix chain + octane alias as the native
// build, so leaves compile under the nativescript renderer and 'octane'
// resolves to octane/universal/native. Tests drive the runtime through the
// object driver (no @nativescript/core needed). `ssr: false` pins client
// compilation — vitest transforms through the SSR pipeline by default and
// the nativescript renderer is server:'unsupported'. The app-level
// @octanejs/vite-plugin wrapper doesn't forward this flag, so tests use the
// compiler plugin directly.
const NATIVE_EXTS = [
	'.ios.tsrx',
	'.android.tsrx',
	'.mobile.tsrx',
	'.tsrx',
	'.ios.tsx',
	'.android.tsx',
	'.mobile.tsx',
	'.tsx',
	'.ios.ts',
	'.android.ts',
	'.mobile.ts',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

export default defineConfig({
	plugins: [
		octane({
			ssr: false,
			renderers: {
				registry: { nativescript: nativeScriptRenderer },
				rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
			},
		}),
	],
	resolve: {
		conditions: ['native'],
		alias: [
			{ find: /^octane$/, replacement: 'octane/universal/native' },
			// Vitest's SSR resolver otherwise redirects the authored client hook
			// module to signals/server, despite client universal compilation.
			{
				find: /^octane\/signals\/client$/,
				replacement: new URL('./node_modules/octane/dist/node/signals/client.js', import.meta.url)
					.pathname,
			},
			// Compiled leaves import the renderer module (the driver package),
			// whose index pulls @nativescript/core — not loadable in node.
			// Object-driver tests only need its universal-runtime re-exports.
			{
				find: /^@nativescript-community\/octane$/,
				replacement: 'octane/universal/native',
			},
		],
		extensions: NATIVE_EXTS,
	},
	test: {
		include: ['src/**/*.mobile.test.{ts,tsx,tsrx}'],
		environment: 'node',
	},
})

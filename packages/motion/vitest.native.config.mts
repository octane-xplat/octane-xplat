import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
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
const configDir = dirname(fileURLToPath(import.meta.url))

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
			{
				find: /^@octane-xplat\/ui$/,
				replacement: resolve(configDir, 'test/ui.mobile.tsrx'),
			},
			{
				find: './clock',
				replacement: resolve(configDir, 'test/platform.ts'),
			},
			{
				find: './reduced-motion',
				replacement: resolve(configDir, 'test/platform.ts'),
			},
			{ find: /^octane$/, replacement: 'octane/universal/native' },
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

import { configDefaults, defineConfig } from 'vitest/config'
import { APPKIT_EXTENSIONS, APPKIT_TESTS } from './vitest.appkit-options.mts'
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
const target = process.env.XPLAT_UI_TEST_TARGET ?? 'mobile'
if (target !== 'mobile' && target !== 'macos') {throw new Error('XPLAT_UI_TEST_TARGET must be mobile or macos')}
const appkit = target === 'macos'

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
		conditions: appkit ? ['macos', 'native'] : ['native'],
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
				replacement: new URL('./tests/octane-native-shim.ts', import.meta.url).pathname,
			},
			// The mason layout plugin evaluates platform globals (__ANDROID__/
			// __APPLE__) and touches native APIs at import — substitute a
			// recording fake that exposes the _styleHelper + Style.fromView
			// surfaces the patched driver calls.
			{
				find: /^@octane-xplat\/nativescript-masonkit\/style$/,
				replacement: new URL('./tests/masonkit-mock.ts', import.meta.url).pathname,
			},
			{
				find: /^@octane-xplat\/nativescript-masonkit$/,
				replacement: new URL('./tests/masonkit-mock.ts', import.meta.url).pathname,
			},
		],
		extensions: appkit ? APPKIT_EXTENSIONS : NATIVE_EXTS,
	},
	test: {
		// Turbo runs package suites together; keep their worker pools bounded.
		maxWorkers: 2,
		include: appkit ? APPKIT_TESTS : ['src/**/*.mobile.test.{ts,tsx,tsrx}'],
		exclude: [...configDefaults.exclude, ...(appkit ? [] : APPKIT_TESTS)],
		environment: 'node',
	},
})

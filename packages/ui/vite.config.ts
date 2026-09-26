import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — compiles .tsrx → JS per platform target so consumers
// don't need the .tsrx toolchain. Two invocations: `vite build` (web) and
// `vite build --mode native`. Output preserves the module structure; the
// suffix chain resolves at build time (web: .web.*, native: .ios/.android/
// .native). Runtime deps stay external via peerDependencies.

const NATIVE_EXTS = [
	'.ios.tsrx',
	'.android.tsrx',
	'.native.tsrx',
	'.tsrx',
	'.ios.tsx',
	'.android.tsx',
	'.native.tsx',
	'.tsx',
	'.ios.ts',
	'.android.ts',
	'.native.ts',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

const WEB_EXTS = [
	'.web.tsrx',
	'.tsrx',
	'.web.tsx',
	'.tsx',
	'.web.ts',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

export default defineConfig(({ mode }) => {
	const native = mode === 'native'
	return {
		plugins: octane({
			renderers: native
				? {
						registry: { nativescript: nativeScriptRenderer },
						rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
					}
				: undefined,
		}),
		build: {
			lib: {
				entry: (native
					? {
							ui: 'src/index.native.ts',
							'ios/index': 'src/ios/index.ts',
							'android/index': 'src/android/index.ts',
						}
					: {
							ui: 'src/index.web.ts',
							'web/index': 'src/web/index.ts',
						}) as Record<string, string>,
				formats: ['es'],
			},
			outDir: native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: { preserveModules: true },
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			alias: native ? [{ find: /^octane$/, replacement: 'octane/universal/native' }] : [],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — compiles .tsrx → JS per platform target so consumers
// don't need the .tsrx toolchain. Two invocations: `vite build` (web) and
// `vite build --mode native`. Output preserves the module structure; the
// suffix chain resolves at build time (web: .web.*, native: .ios/.android/
// unsuffixed native default). Runtime deps stay external via peerDependencies.

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
							ui: 'src/index.ts',
							'ios/index': 'src/ios/index.ts',
							'android/index': 'src/android/index.ts',
							'native/index': 'src/native/index.ts',
							// Vendored ui-svg: the './vendor/ui-svg' specifier stays
							// external so the consumer's per-platform build resolves
							// index.ios.js / index.android.js itself.
							'vendor/ui-svg/index.ios': 'src/vendor/ui-svg/index.ios.ts',
							'vendor/ui-svg/index.android': 'src/vendor/ui-svg/index.android.ts',
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
				output: {
					preserveModules: true,
					// `octane` is external, so `resolve.alias` never sees it (externals
					// are matched on the raw specifier). Rewrite it at emit time
					// instead: native-targeted code importing the DOM entry bundles a
					// second octane runtime and crashes on first render
					// (null CURRENT_SCOPE.hooks). Exact match only — `octane/*`
					// subpaths stay as authored.
					...(native
						? {
								paths: (id) =>
									id === 'octane' ? 'octane/universal/native' : id,
							}
						: {}),
				},
				external: [
					/^octane/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					/^@nstudio\//,
					/^\.\/vendor\/ui-svg$/,
				],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

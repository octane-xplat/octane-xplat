import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — same shape as @octane-xplat/gif: compiles .tsrx → JS per
// target so consumers don't need the .tsrx toolchain. `lottie-web` stays
// external — a real dependency the consumer's bundler picks up. The
// ui-lottie plugin is vendored as a git submodule at src/vendor/ui-lottie
// (octane-xplat/ui-lottie, branch xplat-vendored — xplat-fixes + vendoring
// markers). The specifier stays external so the app bundler resolves
// index.{ios,android}.ts per platform.

const NATIVE_EXTS = [
	'.ios.tsrx', '.android.tsrx', '.mobile.tsrx', '.tsrx',
	'.ios.tsx', '.android.tsx', '.mobile.tsx', '.tsx',
	'.ios.ts', '.android.ts', '.mobile.ts',
	'.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
]

const WEB_EXTS = [
	'.web.tsrx', '.tsrx', '.web.tsx', '.tsx',
	'.web.ts', '.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
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
							index: 'src/Lottie.tsrx',
							// Vendored plugin: the './plugin' specifier stays
							// external so the consumer's per-platform build
							// resolves index.ios.js / index.android.js itself.
							'vendor/ui-lottie/index.ios': 'src/vendor/ui-lottie/src/lottie/index.ios.ts',
							'vendor/ui-lottie/index.android': 'src/vendor/ui-lottie/src/lottie/index.android.ts',
						}
					: { index: 'src/Lottie.web.tsrx' }) as Record<string, string>,
				formats: ['es'],
			},
			outDir: native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: {
					preserveModules: true,
					// `octane` is external, so `resolve.alias` never sees it
					// (externals match the raw specifier). Rewrite at emit
					// instead: native code importing the DOM entry bundles a
					// second octane runtime. Exact match only.
					...(native
						? {
								paths: (id) => {
									if (id === 'octane') { return 'octane/universal/native' }
									// The vendored specifier resolves to an absolute path before
									// emit; rolldown relativizes it against the package root,
									// producing './src/vendor/...' which misses dist/native.
									if (id.endsWith('/src/vendor/ui-lottie/src/lottie')) { return './vendor/ui-lottie' }
									return id
								},
							}
						: {}),
				},
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//, /^lottie-web/, /^\.\/vendor\/ui-lottie\/src\/lottie$/],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

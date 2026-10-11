import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — same shape as @octane-xplat/gif and @octane-xplat/ui:
// compiles .tsrx → JS per target so consumers don't need the .tsrx
// toolchain (and so the published package is vendored into the dev
// deps-bundle, which inlines the @nativescript/canvas plugin dep — a
// .tsrx-source-only package can't be esbuild-bundled there).

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

const MACOS_EXTS = [
	'.macos.tsrx',
	'.tsrx',
	'.macos.tsx',
	'.tsx',
	'.macos.ts',
	'.ts',
	'.mjs',
	'.mts',
	'.js',
	'.json',
]

export default defineConfig(({ mode }) => {
	const macos = mode === 'macos'
	const native = mode === 'native' || macos
	const renderer = macos ? 'macos' : 'nativescript'
	return {
		plugins: octane({
			renderers: native
				? {
						registry: macos
							? {
									macos: {
										module: '@octane-xplat/macos-renderer',
										target: 'universal',
										server: 'unsupported',
										text: 'host',
										intrinsics: '@octane-xplat/macos-renderer/intrinsics',
									},
								}
							: { nativescript: nativeScriptRenderer },
						rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer }],
					}
				: undefined,
		}),
		build: {
			lib: {
				entry: {
					index: macos ? 'src/index.macos.ts' : native ? 'src/index.ts' : 'src/index.web.ts',
				},
				formats: ['es'],
			},
			outDir: macos ? 'dist/macos' : native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: {
					preserveModules: true,
					// `octane` is external, so `resolve.alias` never sees it
					// (externals match the raw specifier). Rewrite at emit
					// instead: native code importing the DOM entry bundles a
					// second octane runtime. Exact match only.
					...(native ? { paths: (id) => (id === 'octane' ? 'octane/universal/native' : id) } : {}),
				},
				external: [
					/^octane/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					/^@octane-xplat\/macos-renderer/,
				],
			},
		},
		resolve: {
			conditions: macos ? ['macos', 'native'] : [native ? 'native' : 'web'],
			extensions: macos ? MACOS_EXTS : native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — same shape as @octane-xplat/canvas and @octane-xplat/table:
// compiles .tsrx → JS per target so consumers don't need the .tsrx toolchain
// (and so the published package is vendored into the dev deps-bundle).
// The d3 subset stays external — real dependencies resolve from the app.

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
	const macos = mode === 'macos'
	const platformNative = native || macos
	return {
		plugins: octane({
			renderers: platformNative
				? {
						registry: {
							[macos ? 'macos' : 'nativescript']: macos
								? {
										module: '@octane-xplat/macos-renderer',
										target: 'universal',
										server: 'unsupported',
										text: 'host',
									}
								: nativeScriptRenderer,
						},
						rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: macos ? 'macos' : 'nativescript' }],
					}
				: undefined,
		}),
		build: {
			lib: {
				entry: { index: macos ? 'src/index.macos.ts' : native ? 'src/index.ts' : 'src/index.web.ts' },
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
					paths: platformNative
						? (id) => id === 'octane'
							? 'octane/universal/native'
							: id === '@octane-xplat/macos-renderer'
								? '@nativescript-community/octane'
								: id
						: undefined,
				},
				external: [
					/^octane/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					/^@octane-xplat\//,
					/^d3-/,
				],
			},
		},
		resolve: {
			conditions: [macos ? 'macos' : native ? 'native' : 'web'],
			extensions: macos
				? ['.macos.tsrx', '.macos.tsx', '.macos.ts', ...WEB_EXTS.filter((ext) => !ext.startsWith('.web'))]
				: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

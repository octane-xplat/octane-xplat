import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

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
							'ios/index': 'src/ios/index.ts',
							'android/index': 'src/android/index.ts',
						}
					: { 'web/index': 'src/web/index.ts' }) as Record<string, string>,
				formats: ['es'] as any,
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
					...(native ? { paths: (id) => (id === 'octane' ? 'octane/universal/native' : id) } : {}),
				},
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//, /^@octane-xplat\//],
			},
		},
		resolve: {
			conditions: native ? ['native'] : ['web'],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

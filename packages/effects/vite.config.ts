import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — native only (the package has no web surface). Compiles
// .tsrx → JS so consumers don't need the .tsrx toolchain; same shape as
// @octane-xplat/ui's native mode.

const NATIVE_EXTS = [
	'.ios.tsrx', '.android.tsrx', '.mobile.tsrx', '.tsrx',
	'.ios.tsx', '.android.tsx', '.mobile.tsx', '.tsx',
	'.ios.ts', '.android.ts', '.mobile.ts',
	'.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
]

export default defineConfig(() => ({
	plugins: octane({
		renderers: {
			registry: { nativescript: nativeScriptRenderer },
			rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
		},
	}),
	build: {
		lib: {
			entry: {
				'ios/index': 'src/ios/index.ts',
				'android/index': 'src/android/index.ts',
			},
			formats: ['es'] as any,
		},
		outDir: 'dist/native',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			output: {
				preserveModules: true,
				// `octane` is external, so `resolve.alias` never sees it
				// (externals match the raw specifier). Rewrite at emit
				// instead: native code importing the DOM entry bundles a
				// second octane runtime. Exact match only.
				paths: (id) => (id === 'octane' ? 'octane/universal/native' : id),
			},
			external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//],
		},
	},
	resolve: {
		conditions: ['native'],
		extensions: NATIVE_EXTS,
	},
}))

import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Library build — same shape as @octane-xplat/gif and @octane-xplat/ui:
// compiles .tsrx → JS per target so consumers don't need the .tsrx
// toolchain (and so the published package is vendored into the dev
// deps-bundle, which inlines the @nativescript/canvas plugin dep — a
// .tsrx-source-only package can't be esbuild-bundled there).

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
				entry: { index: native ? 'src/index.ts' : 'src/index.web.ts' },
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

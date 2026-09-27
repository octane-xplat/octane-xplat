import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

const NATIVE_EXTS = [
	'.ios.tsrx', '.android.tsrx', '.native.tsrx', '.tsrx',
	'.ios.tsx', '.android.tsx', '.native.tsx', '.tsx',
	'.ios.ts', '.android.ts', '.native.ts',
	'.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
]

const WEB_EXTS = [
	'.web.tsrx', '.tsrx', '.web.tsx', '.tsx',
	'.web.ts', '.mjs', '.mts', '.ts', '.jsx', '.js', '.json',
]

export default defineConfig(({ mode }) => {
	const native = mode === 'native'
	const entry: Record<string, string> = native
		? {
				index: 'src/index.native.ts',
				'CameraView.ios': 'src/CameraView.ios.tsrx',
				'CameraView.android': 'src/CameraView.android.tsrx',
			}
		: { index: 'src/index.web.ts' }

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
				entry,
				formats: ['es'],
			},
			outDir: native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: { preserveModules: true },
				external: [
					/^octane/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					/^\.\/CameraView$/,
				],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			alias: native ? [{ find: /^octane$/, replacement: 'octane/universal/native' }] : [],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

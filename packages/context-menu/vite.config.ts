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
				output: { preserveModules: true },
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//],
			},
		},
		resolve: {
			conditions: native ? ['native'] : ['web'],
			...(native
				? {
						alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
						extensions: NATIVE_EXTS,
					}
				: {}),
		},
	}
})

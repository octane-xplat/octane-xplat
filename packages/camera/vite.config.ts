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

// The Linux WebKitGTK target resolves .linux → .web → unsuffixed, sharing the
// DOM entry while its own adapter leaves win.
const LINUX_EXTS = [
	'.linux.tsrx',
	'.web.tsrx',
	'.tsrx',
	'.linux.tsx',
	'.web.tsx',
	'.tsx',
	'.linux.ts',
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
	const linux = mode === 'linux'
	const entry: Record<string, string> = native
		? {
				index: 'src/index.ts',
				'CameraView.ios': 'src/CameraView.ios.tsrx',
				'CameraView.android': 'src/CameraView.android.tsrx',
				'CameraView.windows': 'src/CameraView.windows.tsrx',
				'session-backend.ios': 'src/session-backend.ios.ts',
				'session-backend.android': 'src/session-backend.android.ts',
				'session-backend.windows': 'src/session-backend.windows.ts',
				'session-backend': 'src/session-backend.ts',
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
			outDir: native ? 'dist/native' : linux ? 'dist/linux' : 'dist/web',
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
					/^mediabunny$/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					// The desktop host bridge ships in the platform package — the
					// consumer's own @octane-xplat/platform supplies it at runtime.
					/^@octane-xplat\/platform/,
					// Platform-suffixed modules stay extensionless in the
					// native build so the app's resolver picks the right
					// variant per target. Web resolves them normally.
					...(native ? [/^\.\/CameraView$/, /^\.\/session-backend$/] : []),
				],
			},
		},
		resolve: {
			conditions: native ? ['native'] : linux ? ['linux', 'web'] : ['web'],
			extensions: native ? NATIVE_EXTS : linux ? LINUX_EXTS : WEB_EXTS,
		},
	}
})

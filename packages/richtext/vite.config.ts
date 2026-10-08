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
	const entry: Record<string, string> = native
		? {
				index: 'src/index.ts',
				'RichTextEditor.ios': 'src/RichTextEditor.ios.tsrx',
				'RichTextEditor.android': 'src/RichTextEditor.android.tsrx',
				'RichTextEditor.windows': 'src/RichTextEditor.windows.tsrx',
			}
		: { index: 'src/index.web.ts' }

	return {
		plugins: [
			// preserveModules rewrites the externalized './RichTextEditor'
			// specifier to its source path ('./src/RichTextEditor'), which
			// resolves nowhere from dist/native/index.js. Fix the emitted
			// specifier back to the emitted sibling files.
			native && {
				name: 'xplat-richtext-fix-external-suffix',
				generateBundle(_o: any, bundle: Record<string, any>) {
					for (const chunk of Object.values(bundle)) {
						if (chunk.type === 'chunk' && typeof chunk.code === 'string') {
							chunk.code = chunk.code.replaceAll('"./src/RichTextEditor"', '"./RichTextEditor"')
						}
					}
				},
			},
			octane({
				renderers: native
					? {
							registry: { nativescript: nativeScriptRenderer },
							rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
						}
					: undefined,
			}),
		],
		build: {
			lib: {
				entry,
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
					...(native ? { paths: (id) => (id === 'octane' ? 'octane/universal/native' : id) } : {}),
				},
				external: [
					/^octane/,
					/^@nativescript\//,
					/^@nativescript-community\//,
					/^\.\/RichTextEditor$/,
				],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			extensions: native ? NATIVE_EXTS : WEB_EXTS,
		},
	}
})

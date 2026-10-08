import { existsSync, readdirSync } from 'node:fs'
import { URL } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

const EXTENSIONS = [
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
	const linux = mode === 'linux'
	const entry: Record<string, string> = {}
	for (const file of readdirSync(new URL('./src/', import.meta.url))) {
		if (!/\.(ts|tsrx)$/.test(file) || /\.(test|web|macos|linux)\./.test(file)) {
			continue
		}

		const name = file.replace(/\.(ts|tsrx)$/, '')
		const web = `src/${name}.web${file.endsWith('.tsrx') ? '.tsrx' : '.ts'}`
		const linuxFile = `src/${name}.linux${file.endsWith('.tsrx') ? '.tsrx' : '.ts'}`
		entry[name] =
			linux && existsSync(new URL(linuxFile, import.meta.url))
				? linuxFile
				: !native && existsSync(new URL(web, import.meta.url))
					? web
					: `src/${file}`
	}

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
			outDir: linux ? 'dist/linux' : native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				output: {
					preserveModules: true,
					entryFileNames: '[name].js',
					// `octane` is external, so `resolve.alias` never fires —
					// rewrite the specifier at emit: native must not bundle
					// the DOM runtime.
					paths: native ? (id) => (id === 'octane' ? 'octane/universal/native' : id) : undefined,
				},
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//, /^@octane-xplat\//],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			extensions: native
				? EXTENSIONS
				: [
						...(linux ? ['.linux.tsrx', '.linux.ts'] : []),
						'.web.tsrx',
						'.tsrx',
						'.web.ts',
						'.ts',
						'.tsx',
						'.mjs',
						'.js',
						'.json',
					],
		},
	}
})

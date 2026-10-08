import { readdirSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Preserve the existing source subpaths, including explicit platform suffixes.
// Prefer hook implementations over their .ts typechecking shims.
const entries: Record<string, string> = {}
for (const file of readdirSync(new URL('./src/', import.meta.url))) {
	if (!/\.(ts|tsrx)$/.test(file) || /\.(test|d)\./.test(file)) {
		continue
	}

	const name = file.replace(/\.(ts|tsrx)$/, '')
	if (!entries[name] || file.endsWith('.tsrx')) {
		entries[name] = `src/${file}`
	}
}

export default defineConfig(({ mode }) => {
	const linux = mode === 'linux'
	const native = mode === 'native'
	const targetEntries = Object.fromEntries(
		Object.entries(entries)
			.filter(
				([name]) => (!native || !name.endsWith('.web')) && (linux || !name.endsWith('.linux')),
			)
			.map(([name, file]) => [
				name,
				!native
					? ((linux ? entries[`${name}.linux`] : undefined) ?? entries[`${name}.web`] ?? file)
					: file,
			]),
	)

	return {
		plugins: [
			{
				name: 'platform-entry-aliases',
				resolveId(id) {
					const at = id.indexOf('platform-entry:')
					if (at !== -1) {
						return `\0${id.slice(at)}`
					}
				},
				load(id) {
					if (!id.startsWith('\0platform-entry:')) {
						return
					}

					const name = id.slice('\0platform-entry:'.length)
					const file = fileURLToPath(new URL(targetEntries[name], import.meta.url))
					return `export * from ${JSON.stringify(file)}`
				},
			},
			octane({
				renderers: {
					registry: { nativescript: nativeScriptRenderer },
					rules: [
						{ include: '**/*.web.{ts,tsx,tsrx}', renderer: 'dom' },
						{ include: '**/*.{ts,tsx,tsrx}', renderer: native ? 'nativescript' : 'dom' },
					],
				},
			}),
		],
		build: {
			lib: {
				entry: targetEntries,
				formats: ['es'],
			},
			outDir: linux ? 'dist/linux' : native ? 'dist/native' : 'dist/web',
			emptyOutDir: true,
			minify: false,
			rollupOptions: {
				input: Object.fromEntries(
					Object.keys(targetEntries).map((name) => [name, `platform-entry:${name}`]),
				),
				output: {
					preserveModules: true,
					entryFileNames: '[name].js',
					paths: native ? (id) => (id === 'octane' ? 'octane/universal/native' : id) : undefined,
				},
				external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//],
			},
		},
		resolve: {
			conditions: [native ? 'native' : 'web'],
			extensions: [
				...(native ? ['.ios.tsrx', '.android.tsrx', '.mobile.tsrx'] : ['.web.tsrx']),
				'.tsrx',
				...(linux ? ['.linux.ts'] : []),
				...(native ? ['.ios.ts', '.android.ts', '.mobile.ts'] : ['.web.ts']),
				'.ts',
				'.tsx',
				'.mjs',
				'.js',
				'.json',
			],
		},
	}
})

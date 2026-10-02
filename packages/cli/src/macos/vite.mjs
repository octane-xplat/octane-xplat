import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { xplatBoundary, xplatNodeEnvDefine } from '../vite.mjs'

const renderer = '@octane-xplat/macos-renderer'
const runtime = '@nativescript/macos-node-api'

/** AppKit compiler and bundle setup; the consuming app owns the toolchain. */
export async function xplatMacOS(env, options = {}) {
	const mode = typeof env === 'string' ? env : env.mode
	const root = resolve(options.root ?? process.cwd())
	const appRequire = createRequire(join(root, 'package.json'))
	const { octane } = await import(
		pathToFileURL(realpathSync(appRequire.resolve('@octanejs/vite-plugin'))).href
	)

	const packaged = options.packaged ?? true
	const resolveApp = (name) => realpathSync(appRequire.resolve(name))

	return {
		root,
		define: xplatNodeEnvDefine(mode),
		plugins: [
			xplatBoundary('macos'),
			octane({
				hmr: options.hmr ?? false,
				renderers: {
					registry: {
						macos: {
							module: renderer,
							target: 'universal',
							server: 'unsupported',
							text: 'host',
							intrinsics: `${renderer}/intrinsics`,
						},
					},
					rules: options.rules ?? [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
				},
			}),
		],
		build: {
			outDir: options.outDir ?? (packaged ? 'dist/package-build' : 'dist'),
			emptyOutDir: packaged,
			lib: {
				entry: options.entry ?? (packaged ? 'src/main.mjs' : 'src/App.tsx'),
				formats: packaged ? ['cjs'] : ['es'],
				fileName: packaged ? 'main' : 'app',
			},
			rollupOptions: {
				external: packaged ? [runtime, /^node:/] : [runtime, renderer, /^octane\//],
			},
		},
		resolve: {
			conditions: ['macos', 'native'],
			dedupe: ['octane'],
			alias: [
				...(packaged
					? [{ find: /^@octane-xplat\/macos-renderer$/, replacement: resolveApp(renderer) }]
					: []),
				{ find: /^octane$/, replacement: 'octane/universal/native' },
				{ find: /^@nativescript-community\/octane$/, replacement: renderer },
				{ find: './escape-props', replacement: resolveApp(`${renderer}/compat/escape-props`) },
				{
					find: /^@nativescript\/core$/,
					replacement: resolveApp(`${renderer}/compat/native-core`),
				},
				{
					find: /^@nativescript\/core\/animation-frame$/,
					replacement: resolveApp(`${renderer}/compat/native-core`),
				},
			],
			extensions: [
				'.macos.tsrx',
				'.tsrx',
				'.macos.tsx',
				'.tsx',
				'.macos.ts',
				'.mjs',
				'.mts',
				'.ts',
				'.jsx',
				'.js',
				'.json',
			],
		},
	}
}

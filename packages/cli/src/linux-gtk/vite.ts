// @ts-nocheck — .mjs-style module; annotations pending (transitional)
import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { xplatBoundary, xplatNodeEnvDefine, xplatCss } from '../vite.ts'

const renderer = '@octane-xplat/linux-gtk'

/** GTK4/GJS compiler and bundle setup; the consuming app owns the toolchain.
 *  Produces a single ESM file `gjs -m` executes — the Octane universal
 *  runtime and the app's components are bundled; `gi://` introspection
 *  imports stay external because the GI libraries are the platform. */
export async function xplatLinuxGtk(env, options = {}) {
	const mode = typeof env === 'string' ? env : env.mode
	const root = resolve(options.root ?? process.cwd())
	const appRequire = createRequire(join(root, 'package.json'))
	const { octane } = await import(
		pathToFileURL(realpathSync(appRequire.resolve('@octanejs/vite-plugin'))).href
	)
	const resolveApp = (name) => realpathSync(appRequire.resolve(name))
	// The universal runtime must be the same module the bundler reaches —
	// resolve through the app's dependency tree, not ours.
	const universalNative = realpathSync(appRequire.resolve('octane/universal/native'))

	return {
		root,
		define: xplatNodeEnvDefine(mode),
		plugins: [
			xplatCss('gtk'),
			xplatBoundary('gtk'),
			octane({
				hmr: options.hmr ?? false,
				exclude: options.exclude,
				renderers: {
					registry: {
						gtk: {
							module: renderer,
							target: 'universal',
							server: 'unsupported',
							text: 'host',
							// The shared-contract pragma names the source every
							// native target uses; renderer selection is the
							// .gtk include rule, not the pragma.
							intrinsics: '@octane-xplat/jsx',
						},
					},
					rules: options.rules ?? [{ include: '**/*.{tsx,tsrx}', renderer: 'gtk' }],
				},
			}),
		],
		build: {
			outDir: options.outDir ?? 'dist',
			emptyOutDir: true,
			lib: {
				entry: options.entry ?? 'src/main.ts',
				formats: ['es'],
				fileName: options.fileName ?? 'app',
			},
			rollupOptions: {
				// The GI imports resolve to the platform libraries at load time;
				// GJS maps `gi://Gtk?version=4.0` to the installed introspection
				// data — bundling them is meaningless.
				external: (id) => id.startsWith('gi://'),
				// gjs -m executes one file — no code splitting; a second chunk
				// would be an unloadable import at runtime.
				output: { inlineDynamicImports: true },
			},
		},
		resolve: {
			conditions: ['gtk', 'native'],
			dedupe: ['octane'],
			alias: [
				// One universal runtime instance for the app and the renderer.
				{ find: /^octane$/, replacement: universalNative },
				{ find: /^octane\/universal\/native$/, replacement: universalNative },
				// Leaves that touch NativeScript defaults keep working inside a
				// GTK bundle via the renderer's compat shims.
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
				'.gtk.tsrx',
				'.tsrx',
				'.gtk.tsx',
				'.tsx',
				'.gtk.ts',
				'.gtk.mts',
				'.gtk.mjs',
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

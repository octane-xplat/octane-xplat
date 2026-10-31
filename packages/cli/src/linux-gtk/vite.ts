// @ts-nocheck — .mjs-style module; annotations pending (transitional)
import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { xplatBoundary, xplatNodeEnvDefine, xplatCss } from '../vite.ts'
import { xplatInlineStylesheets } from '../inline-stylesheets.ts'

const renderer = '@octane-xplat/linux-gtk'

/** Slot-compiled modules can emit the same `withSlot`/`hookSlots`
 *  import binding in two import statements of a single module (octane's
 *  universal compiler dedupes `hookSlots` intra-file but not `withSlot` —
 *  e.g. `Button.tsrx`; plain `.ts` hook helpers emit duplicate `hookSlots`
 *  under generated `_$hookSlots$` locals too). Rolldown only dedupes
 *  bindings across modules, so the duplicate survives to a `_$withSlot`
 *  redeclaration error in the merged chunk. Keep the first binding per
 *  export and fold later local names into it. Different specifiers are a
 *  real conflict — bail. */
export function xplatGtkSlotDedupe() {
	return {
		name: 'xplat-gtk-slot-dedupe',
		transform(code, id) {
			if (!/\.(tsrx|tsx|ts|mts|js|mjs)$/.test(id)) { return }
			if (!code.includes('withSlot as _') && !code.includes('hookSlots as _')) { return }
			const firstLocal = new Map()
			const firstSpec = new Map()
			const fold = new Map()
			let changed = false
			let out = code.replace(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g,
				(stmt, names, spec) => {
					const kept = []
					for (const raw of names.split(',')) {
						const part = raw.trim()
						const m = part.match(/^(withSlot|hookSlots) as (_\$[A-Za-z0-9_$]+)$/)
						if (!m) {
							if (part) { kept.push(part) }
							continue
						}
						const [, kind, local] = m
						const prev = firstSpec.get(kind)
						if (prev !== undefined && prev !== spec) {
							throw new Error(`xplat-gtk-slot-dedupe: ${kind} imported from '${prev}' and '${spec}' in ${id}`)
						}
						if (firstLocal.has(kind)) {
							if (local !== firstLocal.get(kind)) { fold.set(local, firstLocal.get(kind)) }
							changed = true
							continue
						}
						firstLocal.set(kind, local)
						firstSpec.set(kind, spec)
						kept.push(part)
					}
					if (!kept.length) { changed = true; return '' }
					return `import { ${kept.join(', ')} } from '${spec}';`
				})
			for (const [from, to] of fold) {
				// `\b` is wrong here: `$` is not a word char, so `_$hookSlots` would
				// match the prefix of `_$hookSlots$1`. Refuse any name continuation.
				const rx = new RegExp(from.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')
				if (rx.test(out)) { changed = true; out = out.replace(rx, to) }
			}
			return changed ? { code: out } : undefined
		},
	}
}

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
	const rendererEntry = resolveApp(renderer)
	// The universal runtime must be the same module the bundler reaches —
	// resolve through the app's dependency tree, not ours.
	const universalNative = realpathSync(appRequire.resolve('octane/universal/native'))

	return {
		root,
		define: xplatNodeEnvDefine(mode),
		plugins: [
			xplatGtkSlotDedupe(),
			xplatCss('gtk'),
			xplatInlineStylesheets(),
			xplatBoundary('gtk'),
			octane({
				hmr: options.hmr ?? false,
				exclude: options.exclude,
				renderers: {
					// Plain .ts/.js hook modules match no rule — the whole
					// bundle is universal, so the dom default would lower their
					// useMemo/useCallback to the native memoSlot/memoTake/
					// memoPublish ABI (octane/internal/client, CURRENT_SCOPE-
					// bound) instead of the slotted universal useMemo.
					default: 'gtk',
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
			// cssCodeSplit emits the CSS asset at renderChunk time, before the
			// 'pre' generateBundle where Bamboo's survival check and our
			// stylesheet serializer run (lib-mode's merged asset arrives too late).
			cssCodeSplit: true,
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
				{ find: /^@nativescript-community\/octane$/, replacement: rendererEntry },
				// Workspace UI leaves import the selected renderer from their own graph;
				// resolve it through the app without adding a UI renderer dependency.
				{ find: /^@octane-xplat\/linux-gtk$/, replacement: rendererEntry },
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

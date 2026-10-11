import { bamboocss, type BambooVitePluginOptions } from '@bamboocss/vite'
import type { Plugin } from 'vite'

function runBeforeNativeCss(plugin: Plugin | undefined, anchor: string) {
	const hook = plugin?.generateBundle
	if (plugin && typeof hook === 'function') {
		plugin.generateBundle = { order: 'pre', handler: hook }
	} else if (hook && typeof hook === 'object' && typeof hook.handler === 'function') {
		hook.order = 'pre'
	} else {
		throw new Error(
			`@octane-xplat/bamboo: native CSS adaptation requires ${anchor} with a generateBundle handler`,
		)
	}
}

export interface XplatBambooOptions extends BambooVitePluginOptions {
	/** NativeScript consumes CSS assets in its own generateBundle hook. */
	native?: boolean
}

/**
 * Create Bamboo's Vite plugins for an Octane xplat app.
 *
 * Pass `cwd` and `configPath` when Bamboo's source/config root differs from
 * Vite's app root, as it does in the shared harness.
 */
export function xplatBamboo({ native = false, ...options }: XplatBambooOptions = {}) {
	const plugins = bamboocss(options)

	if (native) {
		// Let Bamboo prune and validate the emitted asset before NativeScript's
		// main-entry hook serializes it into the native bootstrap and removes it.
		const cssPlugin = plugins.find((plugin) => plugin.name === 'bamboocss:css')
		runBeforeNativeCss(cssPlugin, 'bamboocss:css')

		let isBuild = false
		plugins.push({
			name: 'xplat-bamboo:nativescript-entry-graph',
			enforce: 'post',
			configResolved(config) {
				isBuild = config.command === 'build'
			},
			buildEnd(error) {
				if (!isBuild || error) {
					return
				}

				// Inspect the graph, including cached modules in watch builds. A
				// custom entry that already imports the sheet needs no injection.
				if (![...this.getModuleIds()].some((id) => id.split('?')[0] === '\0virtual:bamboo.css')) {
					this.error(
						'@octane-xplat/bamboo: native entry graph is missing virtual:bamboo.css; expected virtual:entry-with-polyfills or an explicit stylesheet import',
					)
				}
			},
			transform(code, id) {
				// @nativescript/vite builds from a generated entry
				// (`virtual:entry-with-polyfills`). Under HMR that entry boots
				// the app over HTTP instead of statically importing the app's
				// main module, so `import 'virtual:bamboo.css'` there never
				// enters the bundle's module graph — while class values still
				// compile, tripping bamboocss's entry-graph check at buildEnd.
				// Import the stylesheet from the generated entry itself so it
				// is in the graph in every mode; the emitted asset then flows
				// through the same generateBundle path as every other .css.
				if (id !== '\0virtual:entry-with-polyfills' || code.includes('virtual:bamboo.css')) {
					return
				}

				return { code: `${code}\nimport 'virtual:bamboo.css';\n`, map: null }
			},
		})

		plugins.push({
			name: 'xplat-bamboo:nativescript-output',
			enforce: 'post',
			options: {
				order: 'post',
				handler(inputOptions) {
					const options = inputOptions as typeof inputOptions & {
						output?: { plugins?: Plugin[] } | Array<{ plugins?: Plugin[] }>
					}

					const outputs = Array.isArray(options.output)
						? options.output
						: options.output
							? [options.output]
							: []

					// Upstream installs one finalizer per configured output. With no
					// output configured its options hook deliberately installs none.
					for (const output of outputs) {
						const finalizers = (output.plugins ?? [])
							.flat(Infinity)
							.filter((plugin): plugin is Plugin =>
								Boolean(plugin && plugin.name?.startsWith('bamboocss:output-finalizer:')),
							)

						if (!finalizers.length) {
							throw new Error(
								'@octane-xplat/bamboo: native CSS adaptation requires a bamboocss:output-finalizer:* plugin for each configured output',
							)
						}

						for (const finalizer of finalizers) {
							runBeforeNativeCss(finalizer, finalizer.name)
						}
					}
				},
			},
		})
	}

	return plugins
}

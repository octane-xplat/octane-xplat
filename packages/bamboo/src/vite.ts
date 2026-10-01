import { bamboocss, type BambooVitePluginOptions } from '@bamboocss/vite'

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
		if (cssPlugin && typeof cssPlugin.generateBundle === 'object') {
			cssPlugin.generateBundle.order = 'pre'
		}
		plugins.push({
			name: 'xplat-bamboo:nativescript-output',
			enforce: 'post',
			options: {
				order: 'post',
				handler(inputOptions) {
					type OutputHook = {
						name?: string
						generateBundle?: { order?: string } | ((...args: never[]) => unknown)
					}
					const options = inputOptions as unknown as {
						output?: { plugins?: OutputHook[] } | Array<{ plugins?: OutputHook[] }>
					}
					const outputs = Array.isArray(options.output)
						? options.output
						: options.output
							? [options.output]
							: []
					for (const output of outputs) {
						for (const plugin of output.plugins ?? []) {
							if (
								plugin.name?.startsWith('bamboocss:output-finalizer:') &&
								typeof plugin.generateBundle === 'object'
							) {
								plugin.generateBundle.order = 'pre'
							}
						}
					}
				},
			},
		})
	}
	return plugins
}

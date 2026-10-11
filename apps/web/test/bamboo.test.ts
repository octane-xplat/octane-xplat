import { describe, expect, it } from 'vitest'
import { xplatBambooConfig } from '@octane-xplat/bamboo'
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

describe('Bamboo xplat defaults', () => {
	it('keeps generated styles in the portable utility layer without preflight', () => {
		expect(xplatBambooConfig).toMatchObject({
			preflight: false,
			cssVarRoot: ':root, .ns-root',
			layers: { utilities: 'xplat.utilities' },
			presets: [],
		})

		expect(xplatBambooConfig.utilities).toHaveProperty('backgroundColor')
		expect(xplatBambooConfig.utilities).not.toHaveProperty('boxShadow')
		expect(xplatBambooConfig.theme.tokens.colors.surface.value).toBe('var(--color-surface)')
	})

	it('runs Bamboo CSS finalizers before NativeScript consumes the CSS asset', () => {
		const plugins = xplatBamboo({ native: true })
		const cssPlugin = plugins.find((plugin) => plugin.name === 'bamboocss:css') as any
		const outputAdapter = plugins.find(
			(plugin) => plugin.name === 'xplat-bamboo:nativescript-output',
		) as any

		const finalizer = {
			name: 'bamboocss:output-finalizer:css',
			generateBundle: { order: 'post', handler() {} },
		}

		expect(cssPlugin.generateBundle.order).toBe('pre')
		outputAdapter.options.handler({ output: { plugins: [finalizer] } })
		expect(finalizer.generateBundle.order).toBe('pre')
	})

	it('adapts the finalizers installed by the pinned Bamboo compiler for multiple outputs', () => {
		const plugins = xplatBamboo({ native: true })
		const compiler = plugins.find((plugin) => plugin.name === 'bamboocss:compiler') as any
		const adapter = plugins.find(
			(plugin) => plugin.name === 'xplat-bamboo:nativescript-output',
		) as any

		const input = { output: [{ plugins: [] as any[] }, { plugins: [] as any[] }] }
		compiler.options.call({ environment: { name: 'client' } }, input)
		adapter.options.handler(input)
		for (const output of input.output) {
			const finalizer = output.plugins.find((plugin) =>
				plugin.name.startsWith('bamboocss:output-finalizer:'),
			)

			expect(finalizer.generateBundle.order).toBe('pre')
			expect(typeof finalizer.generateBundle.handler).toBe('function')
		}
	})
})

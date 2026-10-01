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
			generateBundle: { order: 'post' },
		}

		expect(cssPlugin.generateBundle.order).toBe('pre')
		outputAdapter.options.handler({ output: { plugins: [finalizer] } })
		expect(finalizer.generateBundle.order).toBe('pre')
	})
})

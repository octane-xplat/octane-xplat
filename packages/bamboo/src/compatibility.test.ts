import { afterEach, describe, expect, it, vi } from 'vitest'

const upstream = vi.hoisted(() => ({ plugins: [] as any[], missingProperty: '' }))
vi.mock('@bamboocss/vite', () => ({ bamboocss: () => upstream.plugins }))
vi.mock('@bamboocss/preset-base', async (importOriginal) => {
	const { preset } = await importOriginal<typeof import('@bamboocss/preset-base')>()
	return {
		preset: {
			...preset,
			utilities: new Proxy(preset.utilities, {
				get(target, property) {
					return property === upstream.missingProperty ? undefined : Reflect.get(target, property)
				},
			}),
		},
	}
})

import { xplatBamboo } from './vite'

function cssPlugin(generateBundle: any = { order: 'post', handler() {} }) {
	return { name: 'bamboocss:css', generateBundle }
}

function nativeAdapter() {
	upstream.plugins = [cssPlugin()]
	return xplatBamboo({ native: true }).find(
		(plugin) => plugin.name === 'xplat-bamboo:nativescript-output',
	) as any
}

afterEach(() => {
	upstream.plugins = []
	upstream.missingProperty = ''
	vi.resetModules()
})

describe('portable config compatibility', () => {
	it('deliberately omits unavailable flexWrap and preserves margin token restrictions', async () => {
		const { xplatBambooConfig, xplatPortablePreset } = await import('./config')
		expect(xplatBambooConfig.utilities).not.toHaveProperty('flexWrap')
		expect(Object.keys(xplatBambooConfig.utilities)).toHaveLength(34)
		expect(xplatPortablePreset.utilities).toBe(xplatBambooConfig.utilities)
		expect(xplatBambooConfig.utilities.margin.values).toBe('spacing')
	})

	it('reports an unexpectedly missing portable utility by name', async () => {
		upstream.missingProperty = 'backgroundColor'
		await expect(import('./config')).rejects.toThrow('missing portable utility "backgroundColor"')
	})
})

describe('native plugin compatibility', () => {
	it('leaves web plugins alone when native anchors are absent', () => {
		// platform-output ships unconditionally — inert without the xplatCss
		// platform compiler; no NativeScript adapters land on a web build.
		expect(xplatBamboo().map((plugin) => plugin.name)).toEqual(['xplat-bamboo:platform-output'])
	})

	it.each([undefined, null, {}, { order: 'post' }])(
		'rejects missing or unusable CSS hooks: %j',
		(hook) => {
			upstream.plugins = hook === undefined ? [] : [cssPlugin(hook)]
			expect(() => xplatBamboo({ native: true })).toThrow('requires bamboocss:css')
		},
	)

	it('wraps function hooks without changing their handler and preserves object hook metadata', () => {
		const handler = vi.fn()
		const objectHook = { order: 'post', sequential: true, handler }
		upstream.plugins = [cssPlugin(handler)]
		expect(xplatBamboo({ native: true })[0].generateBundle).toEqual({ order: 'pre', handler })
		upstream.plugins = [cssPlugin(objectHook)]
		xplatBamboo({ native: true })
		expect(objectHook).toEqual({ order: 'pre', sequential: true, handler })
	})

	it('allows absent outputs and empty output arrays as upstream does', () => {
		const adapter = nativeAdapter()
		expect(() => adapter.options.handler({})).not.toThrow()
		expect(() => adapter.options.handler({ output: [] })).not.toThrow()
	})

	it('requires a finalizer for every configured output', () => {
		const adapter = nativeAdapter()
		expect(() => adapter.options.handler({ output: {} })).toThrow('for each configured output')
		const finalizer = {
			name: 'bamboocss:output-finalizer:default:0',
			generateBundle: { handler() {} },
		}

		expect(() => adapter.options.handler({ output: [{ plugins: [finalizer] }, {}] })).toThrow(
			'for each configured output',
		)
	})

	it('adapts nested output plugins and function hooks without touching unrelated hooks', () => {
		const adapter = nativeAdapter()
		const handler = vi.fn()
		const finalizer = { name: 'bamboocss:output-finalizer:default:0', generateBundle: handler }
		const unrelated = { name: 'other', generateBundle: { order: 'post', handler } }
		adapter.options.handler({ output: { plugins: [false, [finalizer], unrelated] } })
		expect(finalizer.generateBundle).toEqual({ order: 'pre', handler })
		expect(unrelated.generateBundle.order).toBe('post')
	})

	it.each([null, {}, { order: 'post' }])(
		'rejects an unusable finalizer hook: %j',
		(generateBundle) => {
			const adapter = nativeAdapter()
			expect(() =>
				adapter.options.handler({
					output: { plugins: [{ name: 'bamboocss:output-finalizer:default:0', generateBundle }] },
				}),
			).toThrow('with a generateBundle handler')
		},
	)

	it('injects the generated entry once and accepts cached or custom stylesheet graphs', () => {
		upstream.plugins = [cssPlugin()]
		const entry = xplatBamboo({ native: true }).find(
			(plugin) => plugin.name === 'xplat-bamboo:nativescript-entry-graph',
		) as any

		entry.configResolved({ command: 'build' })
		const injected = entry.transform('boot()', '\0virtual:entry-with-polyfills')
		expect(injected.code).toContain("import 'virtual:bamboo.css'")
		expect(entry.transform(injected.code, '\0virtual:entry-with-polyfills')).toBeUndefined()
		expect(entry.transform('boot()', 'other-entry')).toBeUndefined()
		const context = { getModuleIds: () => ['\0virtual:bamboo.css'], error: vi.fn() }
		entry.buildEnd.call(context)
		expect(context.error).not.toHaveBeenCalled()
		context.getModuleIds = () => ['renamed-native-entry']
		entry.buildEnd.call(context)
		expect(context.error).toHaveBeenCalledWith(
			expect.stringContaining('native entry graph is missing virtual:bamboo.css'),
		)

		context.error.mockClear()
		entry.configResolved({ command: 'serve' })
		entry.buildEnd.call(context)
		expect(context.error).not.toHaveBeenCalled()
		entry.configResolved({ command: 'build' })
		entry.buildEnd.call(context, new Error('earlier failure'))
		expect(context.error).not.toHaveBeenCalled()
	})
})

describe('build participation compatibility', () => {
	it('requires the pinned Bamboo accounting hooks and a nonempty plan', () => {
		expect(() => xplatBamboo({ buildEnvironments: [] })).toThrow('must contain environment names')
		upstream.plugins = [cssPlugin()]
		expect(() => xplatBamboo({ buildEnvironments: ['client'] })).toThrow(
			'requires Bamboo CSS configResolved and buildApp hooks',
		)
	})

	it('projects only Bamboo views, preserves hook metadata, and leaves dev untouched', () => {
		const resolved = vi.fn()
		const app = vi.fn()
		const css = {
			...cssPlugin(),
			configResolved: { order: 'post', handler: resolved },
			buildApp: { order: 'pre', handler: app },
		}
		upstream.plugins = [css]
		xplatBamboo({ buildEnvironments: ['client'] })
		const environments = { client: {}, ssr: {} }
		const config = { command: 'build', environments }
		const builder = { environments }
		css.configResolved.handler(config)
		css.buildApp.handler(builder)
		expect(resolved.mock.calls[0][0].environments).toEqual({ client: environments.client })
		expect(app.mock.calls[0][0].environments).toEqual({ client: environments.client })
		expect(config.environments).toBe(environments)
		expect(builder.environments).toBe(environments)
		expect(Object.keys(environments)).toEqual(['client', 'ssr'])
		expect(css.configResolved.order).toBe('post')
		expect(css.buildApp.order).toBe('pre')
		const dev = { command: 'serve', environments }
		css.configResolved.handler(dev)
		expect(resolved.mock.calls[1][0]).toBe(dev)
	})
})

// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { defineRoute, defineRouteGroup, withSearchDecoder, RouteSearchValidationError } from './define-route'
import { defineRoutes, deriveRouteManifest, manifestToJson } from './route-table'
import { createRoutePreparation, RouteForbidden } from './routing-core'
import { routeRenderContent } from './route-render-content'
import type { RouteSearchSchema } from './props'

it('programmatic definitions carry inferred behavior through ordinary manifest assembly', async () => {
	const definition = defineRoute({
		path: '/items/:id',
		validateSearch(raw: { page?: unknown }) {
			return { page: Number(raw.page ?? 1) }
		},
		beforeLoad: ({ params }) => ({ title: params.id }),
		loader: ({ search, context }) => ({ title: context.title, page: search.page }),
	}).screen(() => null)
	const core = createRoutePreparation({ catalog: defineRoutes([definition]) })
	expect(await core.prepare('/items/coat?page=2')).toMatchObject({
		status: 'ready',
		match: { data: { title: 'coat', page: 2 } },
	})
})

it('accepts Standard Schema validation without importing a validator dependency', async () => {
	const validator: RouteSearchSchema<{ page?: unknown }, { page: number }> = {
		'~standard': {
			version: 1,
			vendor: 'fixture',
			validate(input) {
				const page = Number((input as { page?: unknown }).page ?? 1)
				return Number.isInteger(page) && page > 0
					? { value: { page } }
					: { issues: [{ message: 'Expected a positive page', path: ['page'] }] }
			},
		},
	}
	const definition = defineRoute({
		path: '/items',
		validateSearch: validator,
		loader: ({ search }) => search.page,
	}).screen(() => null)
	const core = createRoutePreparation({ catalog: defineRoutes([definition]) })
	expect(await core.prepare('/items')).toMatchObject({ status: 'ready', match: { data: 1 } })
	const invalid = await core.prepare('/items?page=no')
	expect(invalid.status).toBe('invalid-input')
	if (invalid.status === 'invalid-input')
		{expect(invalid.error).toBeInstanceOf(RouteSearchValidationError)}
})

it('decodes strict numeric schemas consistently for object destinations, URLs and checked values', async () => {
	const schema: RouteSearchSchema<{ page: number }, { page: number }> = {
		'~standard': {
			version: 1, vendor: 'strict-number',
			validate(raw) {
				const page = (raw as { page: unknown }).page
				return typeof page === 'number' && Number.isInteger(page) && page > 0
					? { value: { page } } : { issues: [{ message: 'Expected a positive integer' }] }
			},
		},
	}
	const validateSearch = withSearchDecoder(schema, raw => ({ page: Number(raw.page) }))
	const loader = ({ search }: { search: { page: number } }) => search.page
	for (const catalog of [
		defineRoutes([defineRoute({ path: '/pages', validateSearch, loader }).screen(() => null)]),
		deriveRouteManifest({ './app/pages.tsx': { validateSearch, loader, screen: () => null } }, ['web']),
	]) {
		const engine = createRoutePreparation({ catalog })
		try {
			const destination = { to: '/pages', search: { page: 2 } }
			const href = engine.href(destination)
			expect(href).toBe('/pages?page=2')
			for (const input of [destination, href]) {
				expect(await engine.prepare(input)).toMatchObject({ status: 'ready', match: { search: { page: 2 }, data: 2 } })
			}
			const checked = await engine.validateDestination(destination)
			expect(checked.status).toBe('valid')
			if (checked.status === 'valid') {
				expect(await engine.prepare(checked.destination)).toMatchObject({ status: 'ready', match: { data: 2 } })
			}
			expect(await engine.prepare('/pages?page=no')).toMatchObject({ status: 'invalid-input', path: 'search' })
		} finally {
			engine.dispose()
		}
	}
})

it.each([false, true])('uses the Standard Schema protocol of a callable validator (async: %s)', async (async) => {
	for (const target of ['web', 'ios', 'android', 'mobile', 'macos', 'linux', 'windows']) {
		let directCalls = 0
		const validator = Object.assign(
			() => {
				directCalls++
				return { page: 'unvalidated' }
			},
			{
				'~standard': {
					version: 1 as const,
					vendor: 'callable-fixture',
					validate(input: unknown) {
						const page = Number((input as { page?: unknown }).page ?? 1)
						const result = Number.isInteger(page) && page > 0
							? { value: { page } }
							: { issues: [{ message: 'Expected a positive page' }] }
						return async ? Promise.resolve(result) : result
					},
				},
			},
		)
		const calls: string[] = []
		const callbacks = {
			validateSearch: validator,
			beforeLoad: () => { calls.push('guard') },
			loader: ({ search }: { search: { page: number } }) => {
				calls.push('loader')
				return { nextPage: search.page + 1 }
			},
			screen: () => null,
		}
		const { screen, ...preparation } = callbacks
		for (const catalog of [
			defineRoutes([defineRoute({ path: '/items', ...preparation }).screen(screen)]),
			deriveRouteManifest({ ['./app/items.' + target + '.tsx']: callbacks }, [target]),
		]) {
			const core = createRoutePreparation({ catalog })
			try {
				calls.length = 0
				expect(await core.prepare('/items?page=2')).toMatchObject({
					status: 'ready', match: { search: { page: 2 }, data: { nextPage: 3 } },
				})
				expect(calls).toEqual(['guard', 'loader'])
				calls.length = 0
				const invalid = await core.prepare('/items?page=invalid')
				expect(invalid).toMatchObject({ status: 'invalid-input', path: 'search' })
				if (invalid.status === 'invalid-input') {
					expect(invalid.error).toBeInstanceOf(RouteSearchValidationError)
				}
				expect(calls).toEqual([])
				expect(directCalls).toBe(0)
			} finally {
				core.dispose()
			}
		}
	}
})

it('reserves search validators instead of mistaking them for named screens', () => {
	const screen = () => null
	const definitions = deriveRouteManifest(
		{
			'./app/help.tsx': { Help: screen, validateSearch: () => ({ page: 1 }) },
		},
		['web'],
	)
	expect(definitions.screens.help).toBe(screen)
})

it('named route files prepare the same structured contract on each platform', async () => {
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
		const calls: string[] = []
		const signal = new AbortController().signal
		const module = {
			validateSearch(raw: { tab?: unknown }) {
				calls.push('validate')
				if (raw.tab !== undefined && raw.tab !== 'details') {throw new Error('Invalid tab')}
				return { tab: 'details' as const }
			},
			beforeLoad(args: {
				params: { id: string }
				search: { tab: string }
				context: { account: string }
				signal?: unknown
			}) {
				calls.push('guard')
				expect(args.signal).toBe(signal)
				expect(args.search).toEqual({ tab: 'details' })
				return { owner: args.context.account + ':' + args.params.id }
			},
			loader(args: {
				params: { id: string }
				search: { tab: string }
				context: { owner: string }
				signal?: unknown
			}) {
				calls.push('loader')
				expect(args.signal).toBe(signal)
				return { title: args.context.owner, tab: args.search.tab }
			},
			screen: () => null,
		}
		const catalog = deriveRouteManifest({ ['./app/items/[id].' + target + '.tsx']: module }, [
			target,
		])
		const core = createRoutePreparation({ catalog, context: { account: 'account-a' } })
		try {
			const result = await core.prepare('/items/coat', { signal })
			expect(result).toMatchObject({
				status: 'ready',
				match: {
					params: { id: 'coat' },
					search: { tab: 'details' },
					context: { account: 'account-a', owner: 'account-a:coat' },
					data: { title: 'account-a:coat', tab: 'details' },
				},
			})
			expect(calls).toEqual(['validate', 'guard', 'loader'])
			if (result.status !== 'ready') {throw new Error('Expected prepared file route')}
			expect(routeRenderContent(catalog, result.match).props).toEqual({
				params: result.match.params,
				search: result.match.search,
				context: result.match.context,
				data: result.match.data,
			})
			expect(catalog.routes[0].loader).toBe(module.loader)
			calls.length = 0
			expect(await core.prepare('/items/coat?tab=invalid')).toMatchObject({
				status: 'invalid-input',
				path: 'search',
			})
			expect(calls).toEqual(['validate'])
		} finally {
			core.dispose()
		}
	}
})

it('named file Standard Schema failures prevent guards and loaders', async () => {
	const validator: RouteSearchSchema<{ page?: unknown }, { page: number }> = {
		'~standard': {
			version: 1,
			vendor: 'fixture',
			validate: () => ({ issues: [{ message: 'Invalid page' }] }),
		},
	}
	let loaded = false
	const catalog = deriveRouteManifest(
		{
			'./app/items.tsx': {
				validateSearch: validator,
				beforeLoad: () => {
					throw new Error('Guard must not run')
				},
				loader: () => {
					loaded = true
				},
				screen: () => null,
			},
		},
		['web'],
	)
	const core = createRoutePreparation({ catalog })
	try {
		const result = await core.prepare('/items')
		expect(result.status).toBe('invalid-input')
		if (result.status === 'invalid-input')
			{expect(result.error).toBeInstanceOf(RouteSearchValidationError)}
		expect(loaded).toBe(false)
	} finally {
		core.dispose()
	}
})

it('named file guard denial prevents loading', async () => {
	let loaded = false
	const catalog = deriveRouteManifest(
		{
			'./app/items.tsx': {
				beforeLoad: () => {
					throw new RouteForbidden()
				},
				loader: () => {
					loaded = true
				},
				screen: () => null,
			},
		},
		['web'],
	)
	const core = createRoutePreparation({ catalog })
	try {
		expect(await core.prepare('/items')).toEqual({ status: 'forbidden' })
		expect(loaded).toBe(false)
	} finally {
		core.dispose()
	}
})

it('baked named files read generated data through structured preparation', async () => {
	const catalog = deriveRouteManifest(
		{ './app/help.tsx': { dataMode: 'baked', screen: () => null } },
		['web'],
	)
	catalog.baked = { help: { title: 'Baked help' } }
	const core = createRoutePreparation({ catalog })
	try {
		expect(await core.prepare('/help')).toMatchObject({
			status: 'ready',
			match: { data: { title: 'Baked help' } },
		})
	} finally {
		core.dispose()
	}
})

it('requires modified inferred definitions to be authored again', () => {
	const original = defineRoute({ path: '/item', loader: () => ({ title: 'item' }) }).screen(() => null)
	expect(() => defineRoutes([{ ...original, preparation: { loader: () => 42 } }])).toThrow('Use defineRoute')
	expect(Reflect.set(original.preparation!, 'loader', () => 42)).toBe(false)
})

it('captures preparation before attaching immutable, independently registered screens', async () => {
	const input = { path: '/captured' as const, loader: () => ({ title: 'captured' }) }
	const builder = defineRoute(input)
	input.loader = () => ({ title: 'changed' })
	const first = builder.screen(() => null)
	const second = builder.screen(() => 'another screen')
	expect(Object.isFrozen(builder)).toBe(true)
	expect('path' in builder).toBe(false)
	expect(first).not.toBe(second)
	expect(Object.isFrozen(first)).toBe(true)
	expect(first.preparation).toBe(second.preparation)
	for (const definition of [first, second]) {
		const core = createRoutePreparation({ catalog: defineRoutes([definition]) })
		try {
			expect(await core.prepare('/captured')).toMatchObject({
				status: 'ready', match: { data: { title: 'captured' } },
			})
		} finally {
			core.dispose()
		}
	}
})

it('rejects flat screen options, unfinished builders and non-component attachments', () => {
	expect(() => Reflect.apply(defineRoute, undefined, [{ path: '/old', screen: () => null }]))
		.toThrow('defineRoute(options).screen(component)')
	const builder = defineRoute({ path: '/unfinished' })
	expect(() => Reflect.apply(defineRoutes, undefined, [[builder]])).toThrow()
	expect(() => Reflect.apply(builder.screen, builder, [null])).toThrow('route screen component')
})


it('prepares parent groups before child guards and loaders for objects and direct URLs', async () => {
	const calls: string[] = []
	const parent = defineRouteGroup.withContext<{ session: string }>()({
		id: 'account',
		beforeLoad: ({ context }) => { calls.push('account guard'); return { user: context.session } },
		loader: ({ context }) => { calls.push('account loader'); return { name: context.user } },
	})
	const child = parent.group({
		id: 'project',
		loader: ({ context }) => { calls.push('project loader'); return { owner: context.account.name } },
	})
	const beforeLoad = ({ context }: { context: { project: { owner: string } } }) => {
		calls.push('child guard')
		return { owner: context.project.owner }
	}
	const loader = ({ context }: { context: { owner: string } }) => { calls.push('child loader'); return context.owner }
	for (const catalog of [
		defineRoutes([child.route({ path: '/projects/:id/edit', beforeLoad, loader }).screen(() => null)]),
		deriveRouteManifest({ './app/projects/[id]/edit.tsx': { group: child, beforeLoad, loader, screen: () => null } }, ['web']),
	]) {
		const engine = createRoutePreparation({ catalog, context: { session: 'Alex' } })
		for (const destination of ['/projects/coat/edit', { to: '/projects/:id/edit', params: { id: 'coat' } }]) {
			calls.length = 0
			expect(await engine.prepare(destination)).toMatchObject({ status: 'ready', match: {
				data: 'Alex', context: { user: 'Alex', account: { name: 'Alex' }, project: { owner: 'Alex' } },
			} })
			expect(calls).toEqual(['account guard', 'account loader', 'project loader', 'child guard', 'child loader'])
		}
		engine.dispose()
	}
})

it('stops child preparation on parent denial or cancellation', async () => {
	const deniedLoader = vi.fn()
	const denied = defineRouteGroup({ id: 'account', beforeLoad: () => { throw new RouteForbidden() } })
	const deniedCatalog = defineRoutes([denied.route({ path: '/private', loader: deniedLoader }).screen(() => null)])
	expect(manifestToJson(deniedCatalog).routes[0]).toMatchObject({ guard: true, loader: true })
	const deniedEngine = createRoutePreparation({ catalog: deniedCatalog })
	expect(await deniedEngine.prepare('/private')).toMatchObject({ status: 'forbidden' })
	expect(deniedLoader).not.toHaveBeenCalled()
	deniedEngine.dispose()
	let resume!: () => void
	const loader = vi.fn()
	const parent = defineRouteGroup({ id: 'account', beforeLoad: () => new Promise<void>(resolve => { resume = resolve }) })
	const engine = createRoutePreparation({ catalog: defineRoutes([
		parent.route({ path: '/private', loader }).screen(() => null),
	]) })
	const pending = engine.prepare('/private')
	await vi.waitFor(() => expect(resume).toBeTypeOf('function'))
	engine.cancel()
	expect(await pending).toMatchObject({ status: 'cancelled' })
	resume()
	await Promise.resolve()
	expect(loader).not.toHaveBeenCalled()
	engine.dispose()
})

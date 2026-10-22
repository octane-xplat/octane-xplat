// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { defineRoutes } from './route-table'
import {
	createRoutePreparation,
	createRoutePreparationBatch,
	DestinationRedirect,
	RouteForbidden,
	RouteResourceNotFound,
} from './routing-core'

import type { RoutePreparationOptions } from './props'

const Screen = () => null
const catalog = () =>
	defineRoutes([
		{ path: '/', screen: Screen },
		{ path: '/items/:id', screen: Screen },
		{ path: '/login', screen: Screen },
	])

function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

const create = (extra: Partial<RoutePreparationOptions> = {}) =>
	createRoutePreparation({
		catalog: catalog(),
		createCancellationController: () => new AbortController(),
		...extra,
	})

describe('host-independent routing preparation', () => {
	it.each([false, true])(
		'shares one root snapshot across a host batch (async: %s)',
		async (asyncSource) => {
			let reads = 0
			let account = 'account-a'
			const context = () => {
				reads++
				const value = { account }
				return asyncSource ? Promise.resolve(value) : value
			}
			const engine = create({
				context,
				behaviors: {
					'/items/:id': { beforeLoad: () => ({ entryOnly: true }) },
				},
			})
			const batch = createRoutePreparationBatch(engine)
			expect(await batch.prepare('/items/coat')).toMatchObject({
				status: 'ready',
				match: { context: { account: 'account-a', entryOnly: true } },
			})
			account = 'account-b'
			const second = await batch.prepare('/login')
			expect(second).toMatchObject({
				status: 'ready',
				match: { context: { account: 'account-a' } },
			})
			if (second.status === 'ready') {
				expect(second.match.context).not.toHaveProperty('entryOnly')
			}
			expect(reads).toBe(1)
			expect(await createRoutePreparationBatch(engine).prepare('/login')).toMatchObject({
				status: 'ready',
				match: { context: { account: 'account-b' } },
			})
			expect(reads).toBe(2)
		},
	)

	it('retains a synchronous context failure for the whole host batch', async () => {
		let reads = 0
		const error = new Error('Context failed')
		const engine = create({
			context: () => {
				reads++
				throw error
			},
		})
		const batch = createRoutePreparationBatch(engine)
		for (const url of ['/items/coat', '/login']) {
			expect(await batch.prepare(url)).toEqual({ status: 'failed', phase: 'context', error })
		}
		expect(reads).toBe(1)
	})

	it.each(['object', 'factory'] as const)(
		'snapshots synchronous %s context before yielding',
		async (source) => {
			const services = { read: () => 'shared service' }
			const root = { account: 'account-a', services }
			const router = create({
				context: source === 'factory' ? () => root : root,
				behaviors: {
					'/items/:id': {
						loader({ context }) {
							expect(context.services).toBe(services)
							return { account: context.account }
						},
					},
				},
			})
			const first = router.prepare('/items/coat')
			root.account = 'account-b'
			expect(await first).toMatchObject({
				status: 'ready',
				match: { context: { account: 'account-a' }, data: { account: 'account-a' } },
			})
			expect(await router.prepare('/items/hat')).toMatchObject({
				status: 'ready',
				match: { context: { account: 'account-b' }, data: { account: 'account-b' } },
			})
			expect(root.account).toBe('account-b')
		},
	)

	it('validates configured OS schemes and web origins through the same route pipeline', async () => {
		const router = create({
			base: '/app',
			allowedSchemes: ['pack'],
			allowedOrigins: ['https://app.test'],
		})
		for (const url of [
			'pack://app/items/coat',
			'pack:///app/items/coat',
			'https://APP.test:443/app/items/coat',
		]) {
			expect(await router.prepare(url)).toMatchObject({
				status: 'ready',
				match: { to: '/items/:id', params: { id: 'coat' }, href: '/app/items/coat' },
			})
		}
		for (const url of [
			'other://app/items/coat',
			'https://other.test/app/items/coat',
			'//app.test/app/items/coat',
			'https://user@app.test/app/items/coat',
			'pack://app/items/%ZZ',
			'pack://app/items/coat?unknown=true',
			'pack://app/items/a\\b',
		]) {
			expect((await router.prepare(url)).status, url).toBe('invalid-input')
		}
		expect(create().resolveUrl('pack://items/coat').status).toBe('invalid-input')
		expect(() => create({ allowedSchemes: ['javascript'] })).toThrow(
			'Invalid application URL scheme',
		)
		expect(() => create({ allowedOrigins: ['https://app.test/path'] })).toThrow(
			'Expected an HTTP(S) origin',
		)
	})
	it('returns explicit forbidden and missing-resource outcomes before private loading', async () => {
		let loads = 0
		const denied = create({
			behaviors: {
				'/login': {
					beforeLoad() {
						throw new RouteForbidden()
					},
					loader() {
						loads++
					},
				},
			},
		})
		expect(await denied.prepare('/login')).toEqual({ status: 'forbidden' })
		expect(loads).toBe(0)
		const missing = create({
			behaviors: {
				'/items/:id': {
					loader() {
						throw new RouteResourceNotFound()
					},
				},
			},
		})
		expect(await missing.prepare('/items/coat')).toEqual({
			status: 'not-found',
			reason: 'resource',
		})
		expect((await missing.prepare('/items/coat?undeclared=true')).status).toBe('invalid-input')
	})
	it('matches the root, rejects unknown patterns, and classifies malformed external values', () => {
		const router = create({ base: '/app' })
		expect(router.resolveUrl('/app').status).toBe('matched')
		expect(router.resolveUrl('/app/missing')).toEqual({ status: 'not-found', reason: 'pattern' })
		expect(router.resolveUrl('/app/items/%ZZ').status).toBe('invalid-input')
		expect(router.resolveUrl('/app/items/coat?tab=%ZZ').status).toBe('invalid-input')
		expect(router.resolveUrl('/outside').status).toBe('invalid-input')
	})

	it('validates runtime destination structure without accepting prepared-state injection', () => {
		const router = create()
		for (const destination of [
			{ to: '/items/:id' },
			{ to: '/items/:id', params: { id: {} } },
			{ to: '/login', loaderData: 'injected' },
			{ to: '/login', context: { account: 'injected' } },
			{ to: '/login', params: { id: 'extra' } },
			{ to: '/login', presentation: 'fade' },
		]) {
			expect(router.resolveDestination(destination).status).toBe('invalid-input')
		}
		expect(router.resolveDestination({ to: '/login' }).status).toBe('matched')
		expect(router.resolveDestination({ to: '/missing' }).status).toBe('not-found')
	})

	it('distinguishes unavailable screens and protects URL round trips against reserved path values', () => {
		const manifest = defineRoutes([
			{ path: '/items/new', screen: Screen },
			{ path: '/items/:id', screen: Screen },
		])
		const mutable = { ...manifest, screens: { ...manifest.screens } }
		const router = create({ catalog: mutable })
		expect(router.resolveDestination({ to: '/items/:id', params: { id: 'new' } }).status).toBe(
			'invalid-input',
		)
		delete mutable.screens['items/new']
		const second = create({ catalog: mutable })
		expect(second.resolveUrl('/items/new')).toEqual({ status: 'not-found', reason: 'unavailable' })
		// The first instance's registry view is independent of later definition mutation.
		expect(router.resolveUrl('/items/new').status).toBe('matched')
	})

	it('keeps named stacks separate from root patterns and catch-alls', () => {
		let loads = 0
		const loader = () => {
			loads++
			return null
		}
		const catalog = defineRoutes([
			{ path: '/retention/:id', loader, screen: Screen },
			{ path: '/retention-late', loader, screen: Screen },
			{ path: '/*rest', loader, screen: Screen },
		])
		const engine = createRoutePreparation({ catalog, stacks: ['retention', 'retention-controls'] })
		try {
			expect(engine.resolveDestination({ to: '/retention-late', stack: 'retention' })).toMatchObject({
				status: 'matched', href: '/@retention/retention-late',
				destination: { to: '/retention-late', stack: 'retention' },
			})
			expect(engine.resolveUrl('/@retention/retention-late')).toMatchObject({
				status: 'matched', destination: { to: '/retention-late', stack: 'retention' },
			})
			expect(engine.resolveUrl('/retention/retention-late')).toMatchObject({
				status: 'matched', destination: { to: '/retention/:id', stack: 'root' },
			})
			expect(engine.resolveUrl('/@missing/retention-late')).toMatchObject({ status: 'invalid-input', path: 'stack' })
			expect(
				engine.resolveDestination({ to: '/retention-late', stack: 'retention-controls' }).status,
			).toBe('matched')
			expect(loads).toBe(0)
		} finally {
			engine.dispose()
		}
	})

	it('round-trips stack markers, root @ paths, base paths and encoded stack names', () => {
		const engine = createRoutePreparation({
			catalog: defineRoutes([{ path: '/*rest', screen: Screen }]),
			stacks: ['café/one'], base: '/app',
		})
		try {
			for (const stack of ['root', 'café/one']) {
				const destination = { to: '/*rest', params: { rest: '@café/one' }, stack }
				const href = engine.href(destination)
				expect(href).toBe(stack === 'root' ? '/app/%40caf%C3%A9/one' : '/app/@caf%C3%A9%2Fone/%40caf%C3%A9/one')
				expect(engine.resolveUrl(href)).toMatchObject({ status: 'matched', destination })
			}
		} finally {
			engine.dispose()
		}
	})

	it('validates search before guards and loads using the returned context', async () => {
		const events: string[] = []
		const router = create({
			context: () => ({ account: 'A' }),
			behaviors: {
				'/items/:id': {
					validateSearch(raw) {
						events.push('search')
						const page = Number(raw.page ?? 1)
						if (!Number.isInteger(page) || page < 1) {
							throw new Error('Invalid page')
						}
						return { page }
					},
					beforeLoad({ context, search }) {
						events.push('guard')
						return { label: `${context.account}:${search.page}` }
					},
					loader({ params, context }) {
						events.push('loader')
						return { id: params.id, label: context.label }
					},
				},
			},
		})
		const result = await router.prepare('/items/coat?page=2')
		expect(result).toMatchObject({
			status: 'ready',
			match: {
				to: '/items/:id',
				search: { page: 2 },
				data: { id: 'coat', label: 'A:2' },
			},
		})
		expect(events).toEqual(['search', 'guard', 'loader'])
		events.length = 0
		expect((await router.prepare('/items/coat?page=invalid')).status).toBe('invalid-input')
		expect(events).toEqual(['search'])
	})

	it('returns HTTP-style redirects without protected loading, or follows them for clients', async () => {
		let loads = 0
		const router = create({
			behaviors: {
				'/items/:id': {
					beforeLoad() {
						throw new DestinationRedirect({ to: '/login' })
					},
					loader() {
						loads++
						return 'private'
					},
				},
			},
		})
		expect(await router.prepare('/items/coat', { redirects: 'return' })).toMatchObject({
			status: 'redirect',
			destination: { to: '/login' },
		})
		expect(await router.prepare('/items/coat')).toMatchObject({
			status: 'ready',
			match: { to: '/login' },
		})
		expect(loads).toBe(0)
	})

	it.each(['beforeLoad', 'loader'] as const)(
		'follows or returns redirects from %s using one context snapshot',
		async (phase) => {
			let contextReads = 0
			const events: string[] = []
			const router = create({
				context: () => {
					contextReads++
					return { account: 'a' }
				},
				behaviors: {
					'/items/:id': {
						beforeLoad() {
							events.push('source guard')
							if (phase === 'beforeLoad') {
								throw new DestinationRedirect({ to: '/login' })
							}
							return { privateSourceContext: true }
						},
						loader() {
							events.push('source loader')
							throw new DestinationRedirect({ to: '/login' })
						},
					},
					'/login': {
						beforeLoad({ context }) {
							events.push('target guard')
							expect(context).toEqual({ account: 'a' })
							return { target: true }
						},
						loader({ context }) {
							events.push('target loader')
							return context
						},
					},
				},
			})
			expect(await router.prepare('/items/coat', { redirects: 'return' })).toMatchObject({
				status: 'redirect',
				destination: { to: '/login' },
			})
			expect(contextReads).toBe(1)
			expect(events).toEqual(
				phase === 'loader' ? ['source guard', 'source loader'] : ['source guard'],
			)
			events.length = 0
			expect(await router.prepare('/items/coat')).toMatchObject({
				status: 'ready',
				redirected: true,
				match: {
					to: '/login',
					context: { account: 'a', target: true },
					data: { account: 'a', target: true },
				},
			})
			expect(contextReads).toBe(2)
			expect(events).toEqual(
				phase === 'loader'
					? ['source guard', 'source loader', 'target guard', 'target loader']
					: ['source guard', 'target guard', 'target loader'],
			)
		},
	)

	it.each(['beforeLoad', 'loader'] as const)(
		'validates redirect targets from %s before returning or following them',
		async (phase) => {
			for (const redirects of ['return', 'follow'] as const) {
				for (const [destination, status] of [
					[{ to: '/items/:id' }, 'invalid-input'],
					[{ to: '/missing' }, 'not-found'],
				] as const) {
					const router = create({
						behaviors: {
							'/login': {
								[phase]: () => {
									throw new DestinationRedirect(destination)
								},
							},
						},
					})

					expect((await router.prepare('/login', { redirects })).status).toBe(status)
				}
			}
		},
	)

	it('bounds redirect loops that alternate guard and loader phases', async () => {
		let calls = 0
		const router = create({
			behaviors: {
				'/login': {
					beforeLoad: () => {
						calls++
						throw new DestinationRedirect({ to: '/items/:id', params: { id: 'loop' } })
					},
				},
				'/items/:id': {
					loader: () => {
						calls++
						throw new DestinationRedirect({ to: '/login' })
					},
				},
			},
		})
		expect(await router.prepare('/login')).toMatchObject({ status: 'failed', phase: 'redirect' })
		expect(calls).toBe(17)
	})

	it('bounds redirect loops and identifies failure phases', async () => {
		const loop = create({
			behaviors: {
				'/login': {
					beforeLoad() {
						throw new DestinationRedirect({ to: '/login' })
					},
				},
			},
		})
		expect(await loop.prepare('/login')).toMatchObject({ status: 'failed', phase: 'redirect' })
		const broken = create({
			behaviors: {
				'/login': {
					loader() {
						throw new Error('private')
					},
				},
			},
		})
		expect(await broken.prepare('/login')).toMatchObject({ status: 'failed', phase: 'loader' })
	})

	it('isolates account context, registry views, and interleaved data across instances', async () => {
		const a = deferred<string>()
		const b = deferred<string>()
		const make = (account: string, wait: Promise<string>) =>
			create({
				context: { account },
				behaviors: {
					'/items/:id': {
						async loader({ context }) {
							return `${context.account}:${await wait}`
						},
					},
				},
			})
		const first = make('A', a.promise)
		const second = make('B', b.promise)
		const resultA = first.prepare('/items/coat')
		const resultB = second.prepare('/items/coat')
		b.resolve('B-value')
		expect(await resultB).toMatchObject({ status: 'ready', match: { data: 'B:B-value' } })
		a.resolve('A-value')
		expect(await resultA).toMatchObject({ status: 'ready', match: { data: 'A:A-value' } })
		first.dispose()
		expect((await second.prepare('/login')).status).toBe('ready')
	})

	it('settles superseded work immediately even if its loader ignores cancellation', async () => {
		const wait = deferred<string>()
		const started = deferred<void>()
		let signal: RoutePreparationArgsSignal
		type RoutePreparationArgsSignal = Parameters<
			NonNullable<NonNullable<RoutePreparationOptions['behaviors']>[string]['loader']>
		>[0]['signal']
		const router = create({
			history: 'linear',
			behaviors: {
				'/items/:id': {
					loader(args) {
						signal = args.signal
						started.resolve()
						return wait.promise
					},
				},
			},
		})
		const pending = router.prepare('/items/coat')
		await started.promise
		expect((await router.prepare('/login')).status).toBe('ready')
		expect(await pending).toEqual({ status: 'cancelled', reason: 'superseded' })
		expect(signal!.aborted).toBe(true)
		wait.resolve('late value')
	})

	it('keeps independent named flows concurrent, and disposal affects only the owning instance', async () => {
		const wait = deferred<string>()
		const router = create({
			stacks: ['catalog'],
			behaviors: { '/items/:id': { loader: () => wait.promise } },
		})
		const pending = router.prepare('/@catalog/items/coat')
		expect((await router.prepare('/login')).status).toBe('ready')
		router.dispose()
		expect(await pending).toEqual({ status: 'cancelled', reason: 'disposed' })
		expect(await router.prepare('/login')).toEqual({ status: 'cancelled', reason: 'disposed' })
		wait.resolve('late')
	})

	it('links external request abort to preparation without requiring a DOM runtime', async () => {
		const controller = new AbortController()
		const router = create({ behaviors: { '/items/:id': { loader: () => new Promise(() => {}) } } })
		const pending = router.prepare('/items/coat', { signal: controller.signal })
		controller.abort()
		expect(await pending).toEqual({ status: 'cancelled', reason: 'aborted' })
	})
})

it('validates runtime search without reading context, guarding, loading or claiming navigation', async () => {
	const events: string[] = []
	const router = createRoutePreparation({
		catalog: defineRoutes([{ path: '/items/:id', screen: Screen }]),
		context: () => {
			events.push('context')
			return {}
		},
		behaviors: {
			'/items/:id': {
				validateSearch: async (raw) => {
					events.push('search')
					const page = Number(raw.page ?? 1)
					if (!Number.isSafeInteger(page) || page < 1) {
						throw new Error('Invalid page')
					}
					raw.page = 'validator mutation'
					return { page }
				},
				beforeLoad: () => {
					events.push('guard')
				},
				loader: ({ search }) => {
					events.push('loader')
					return search.page
				},
			},
		},
	})
	const valid = await router.validateDestination({
		to: '/items/:id',
		params: { id: 'coat' },
		search: { page: 2 },
	})
	expect(valid).toMatchObject({
		status: 'valid',
		href: '/items/coat?page=2',
		destination: { params: { id: 'coat' }, search: { page: '2' } },
	})
	expect(events).toEqual(['search'])
	expect(
		await router.validateDestination({
			to: '/items/:id',
			params: { id: 'coat' },
			search: { page: 'bad' },
		}),
	).toMatchObject({ status: 'invalid-input', path: 'search' })
	expect(events).toEqual(['search', 'search'])
	expect(valid.status).toBe('valid')
	if (valid.status !== 'valid') {
		throw new Error('Expected a valid destination')
	}
	expect(await router.prepare(valid.destination)).toMatchObject({
		status: 'ready',
		match: { search: { page: 2 }, data: 2 },
	})
	expect(events).toEqual(['search', 'search', 'context', 'search', 'guard', 'loader'])
	router.dispose()
})

it('cancels independent validation without superseding an in-flight navigation', async () => {
	let finishLoad!: (value: string) => void
	let finishValidation!: (value: Record<string, unknown>) => void
	const loading = new Promise<string>((resolve) => {
		finishLoad = resolve
	})
	const checking = new Promise<Record<string, unknown>>((resolve) => {
		finishValidation = resolve
	})
	const router = createRoutePreparation({
		catalog: defineRoutes([
			{ path: '/item', screen: Screen },
			{ path: '/check', screen: Screen },
		]),
		behaviors: { '/item': { loader: () => loading }, '/check': { validateSearch: () => checking } },
	})
	const pending = router.prepare('/item')
	const controller = new AbortController()
	const validation = router.validateDestination({ to: '/check' }, { signal: controller.signal })
	controller.abort()
	expect(await validation).toEqual({ status: 'cancelled', reason: 'aborted' })
	finishLoad('loaded')
	expect(await pending).toMatchObject({ status: 'ready', match: { data: 'loaded' } })
	const another = router.validateDestination({ to: '/check' })
	router.dispose()
	expect(await another).toEqual({ status: 'cancelled', reason: 'disposed' })
	finishValidation({ accepted: true })
	expect(await router.validateDestination({ to: '/item' })).toEqual({
		status: 'cancelled',
		reason: 'disposed',
	})
})

it('keeps relative redirects in the selected stack and validates current motion names', async () => {
	let loads = 0
	const router = createRoutePreparation({
		catalog: defineRoutes([
			{ path: '/source', screen: Screen },
			{ path: '/target', screen: Screen },
		]),
		stacks: ['library'],
		transitionNames: ['none'],
		behaviors: {
			'/source': {
				beforeLoad: () => {
					throw new DestinationRedirect({ to: '/target' })
				},
			},
			'/target': { loader: () => ++loads },
		},
	})
	expect(await router.prepare({ to: '/source', stack: 'library' })).toMatchObject({
		status: 'ready',
		match: { to: '/target', stack: 'library', href: '/@library/target' },
	})
	expect(await router.validateDestination({ to: '/target', transition: 'invented' })).toMatchObject(
		{ status: 'invalid-input', path: 'transition' },
	)
	expect(await router.prepare({ to: '/target', transition: 'invented' })).toMatchObject({
		status: 'invalid-input',
		path: 'transition',
	})
	expect(loads).toBe(1)
	router.dispose()
})

it('rejects exotic JavaScript validator outputs before guards or loaders', async () => {
  for (const output of [new Date(), new Map(), new Set(), new Error('search'), /search/, [], () => null, 42, null]) {
    const events: string[] = []
    // Exercise the untyped JavaScript boundary rather than a valid TS validator.
    const engine = Reflect.apply(createRoutePreparation, undefined, [{
      catalog: catalog(), behaviors: { '/items/:id': {
        validateSearch: () => output,
        beforeLoad: () => { events.push('guard') },
        loader: () => { events.push('loader') },
      } },
    }])
    expect(await engine.prepare('/items/coat')).toMatchObject({ status: 'invalid-input', path: 'search' })
    expect(events).toEqual([])
  }
})
it('accepts plain and null-prototype validated search field bags', async () => {
  for (const output of [{ page: 2 }, Object.assign(Object.create(null), { page: 2 })]) {
    const engine = create({ behaviors: { '/items/:id': { validateSearch: () => output, loader: ({ search }) => search.page } } })
    expect(await engine.prepare('/items/coat')).toMatchObject({ status: 'ready', match: { search: { page: 2 }, data: 2 } })
  }
})

it('resolves its own generated href for a Unicode static route', async () => {
	const engine = createRoutePreparation({
		base: '/app',
		catalog: defineRoutes([{ path: '/café/:id', screen: Screen }]),
		behaviors: { '/café/:id': { validateSearch: (search) => search } },
	})
	const destination = { to: '/café/:id', params: { id: 'a/b' }, search: { q: 'x+y' }, hash: 'section' }
	const href = engine.href(destination)
	expect(href).toBe('/app/caf%C3%A9/a%2Fb?q=x%2By#section')
	expect(engine.resolveUrl(href)).toMatchObject({ status: 'matched', destination: { params: { id: 'a/b' } } })
	expect(await engine.prepare(href)).toMatchObject({ status: 'ready', match: { params: { id: 'a/b' } } })
})

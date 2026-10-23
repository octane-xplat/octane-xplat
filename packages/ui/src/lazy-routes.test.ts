// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { deriveLazyRouteManifest, mergeRouteManifests, manifestToJson } from './route-table'
import { sealGeneratedRouteCatalog } from './route-contract-scope'
import { createRoutePreparation, DestinationRedirect, RouteForbidden } from './routing-core'
import { routeRenderContent } from './route-render-content'
import { defineRouteGroup } from './define-route'

const Screen = () => null
const Layout = () => null
const Boundary = () => null
function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

it('matches without importing, preloads code only, then prepares fresh inputs on every navigation', async () => {
	const calls: string[] = []
	const group = defineRouteGroup({
		id: 'parent',
		beforeLoad: () => {
			calls.push('parent-guard')
			return { access: true }
		},
		loader: () => {
			calls.push('parent-loader')
			return 'parent-data'
		},
	})
	const load = vi.fn(async () => ({
		default: Screen,
		group,
		ErrorBoundary: Boundary,
		validateSearch: (raw: Record<string, unknown>) => {
			calls.push('search')
			return raw
		},
		beforeLoad: () => {
			calls.push('guard')
		},
		loader: ({ context }: { context: { account: string } }) => {
			calls.push('loader')
			return context.account
		},
		head: ({ data }: { data: string }) => ({ title: data }),
	}))
	const catalog = sealGeneratedRouteCatalog(
		deriveLazyRouteManifest({ './app/items/[id].web.tsx': load }, ['web'], 'app', {
			'./app/_layout.tsx': { default: Layout },
			'./app/items/_layout.tsx': { default: Layout },
		}),
	)
	let account = 'first'
	const engine = createRoutePreparation({
		catalog,
		context: () => {
			calls.push('context')
			return { account }
		},
	})
	expect(catalog.layouts['']).toBe(Layout)
	expect(engine.resolveUrl('/items/coat?q=red').status).toBe('matched')
	expect(load).not.toHaveBeenCalled()
	expect(manifestToJson(catalog).routes[0]).toMatchObject({
		moduleLoaded: false,
		loader: undefined,
	})
	expect(await engine.preload('/items/coat?q=red')).toEqual({
		status: 'preloaded',
		href: '/items/coat?q=red',
	})
	expect(calls).toEqual([])
	expect(manifestToJson(catalog).routes[0]).toMatchObject({
		moduleLoaded: true,
		loader: true,
		guard: true,
	})
	for (const expected of ['first', 'second']) {
		account = expected
		const ready = await engine.prepare('/items/coat?q=red')
		expect(ready).toMatchObject({
			status: 'ready',
			match: { data: expected, context: { access: true, parent: 'parent-data' } },
		})

		if (ready.status !== 'ready') {
			throw new Error('Preparation failed')
		}

		expect(routeRenderContent(catalog, ready.match)).toMatchObject({
			screen: Screen,
			layouts: [Layout],
			boundary: Boundary,
			head: { title: expected },
		})
	}
	expect(load).toHaveBeenCalledTimes(1)
	expect(calls).toEqual(
		Array(2).fill(['context', 'search', 'parent-guard', 'parent-loader', 'guard', 'loader']).flat(),
	)
})

it('deduplicates imports across immutable snapshots without sharing cancellation or prepared data', async () => {
	const code = deferred<unknown>()
	const guard = vi.fn()
	const load = vi.fn(() => code.promise)
	const catalog = sealGeneratedRouteCatalog(
		deriveLazyRouteManifest({ './app/slow.tsx': load }, ['web']),
	)
	const a = createRoutePreparation({ catalog })
	const b = createRoutePreparation({ catalog: mergeRouteManifests(catalog) })
	const abort = new AbortController()
	const warming = a.preload('/slow', { signal: abort.signal })
	const navigation = b.prepare('/slow')
	abort.abort()
	expect(await warming).toEqual({ status: 'cancelled', reason: 'aborted' })
	code.resolve({ default: Screen, beforeLoad: guard })
	expect((await navigation).status).toBe('ready')
	expect(load).toHaveBeenCalledTimes(1)
	expect(guard).toHaveBeenCalledTimes(1)
})

it('retries failed imports and classifies module errors separately from invalid search', async () => {
	const load = vi
		.fn()
		.mockRejectedValueOnce(new Error('offline'))
		.mockRejectedValueOnce(new Error('still offline'))
		.mockResolvedValue({ default: Screen })
	const engine = createRoutePreparation({
		catalog: deriveLazyRouteManifest({ './app/item.tsx': load }, ['web']),
	})
	expect(await engine.preload('/item')).toMatchObject({ status: 'failed', phase: 'module' })
	expect(await engine.validateDestination({ to: '/item' })).toMatchObject({
		status: 'failed',
		phase: 'module',
	})
	expect((await engine.prepare('/item')).status).toBe('ready')
	expect(load).toHaveBeenCalledTimes(3)
})

it('loads search validation before checking and preserves baked data after sealing', async () => {
	const catalog = sealGeneratedRouteCatalog(
		deriveLazyRouteManifest(
			{
				'./app/baked.tsx': async () => ({
					default: Screen,
					dataMode: 'baked',
					validateSearch: () => ({ page: 1 }),
				}),
			},
			['web'],
			'app',
			{},
			{ baked: { title: 'built' } },
		),
	)
	const engine = createRoutePreparation({ catalog })
	expect((await engine.validateDestination({ to: '/baked', search: { page: '1' } })).status).toBe(
		'valid',
	)
	expect(await engine.prepare('/baked?page=1')).toMatchObject({
		status: 'ready',
		match: { search: { page: 1 }, data: { title: 'built' } },
	})
})

it('preloading never grants access, and redirects import and prepare the target normally', async () => {
	const privateLoader = vi.fn()
	const target = vi.fn(async () => ({ default: Screen, loader: () => 'target' }))
	const catalog = deriveLazyRouteManifest(
		{
			'./app/private.tsx': async () => ({
				default: Screen,
				beforeLoad: () => {
					throw new RouteForbidden()
				},
				loader: privateLoader,
			}),
			'./app/old.tsx': async () => ({
				default: Screen,
				beforeLoad: () => {
					throw new DestinationRedirect({ to: '/target' })
				},
			}),
			'./app/target.tsx': target,
		},
		['web'],
	)
	const engine = createRoutePreparation({ catalog })
	expect((await engine.preload('/private')).status).toBe('preloaded')
	expect(await engine.prepare('/private')).toEqual({ status: 'forbidden' })
	expect(privateLoader).not.toHaveBeenCalled()
	expect(await engine.prepare('/old')).toMatchObject({
		status: 'ready',
		redirected: true,
		match: { data: 'target' },
	})
	expect(target).toHaveBeenCalledTimes(1)
})

it('disposal and supersession settle while imports hang and prevent late callbacks', async () => {
	const code = deferred<unknown>()
	const guard = vi.fn()
	const catalog = deriveLazyRouteManifest(
		{ './app/slow.tsx': () => code.promise, './app/fast.tsx': async () => ({ default: Screen }) },
		['web'],
	)
	const a = createRoutePreparation({ catalog, history: 'linear' })
	const pending = a.prepare('/slow')
	expect((await a.prepare('/fast')).status).toBe('ready')
	expect(await pending).toEqual({ status: 'cancelled', reason: 'superseded' })
	const warming = a.preload('/slow')
	a.dispose('registry-changed')
	expect(await warming).toEqual({ status: 'cancelled', reason: 'registry-changed' })
	code.resolve({ default: Screen, beforeLoad: guard })
	await Promise.resolve()
	expect(guard).not.toHaveBeenCalled()
})

it('selects only the preferred platform module and isolates unrelated catalogs with the same path', async () => {
	const fallback = vi.fn(async () => ({ default: Screen, loader: () => 'fallback' }))
	const web = vi.fn(async () => ({ default: Screen, loader: () => 'web' }))
	const ios = vi.fn(async () => ({ default: Screen, loader: () => 'ios' }))
	const files = { './app/item.tsx': fallback, './app/item.web.tsx': web, './app/item.ios.tsx': ios }
	const a = createRoutePreparation({ catalog: deriveLazyRouteManifest(files, ['web']) })
	const b = createRoutePreparation({ catalog: deriveLazyRouteManifest(files, ['ios', 'mobile']) })
	expect(await a.prepare('/item')).toMatchObject({ status: 'ready', match: { data: 'web' } })
	expect(await b.prepare('/item')).toMatchObject({ status: 'ready', match: { data: 'ios' } })
	expect(fallback).not.toHaveBeenCalled()
	expect(web).toHaveBeenCalledTimes(1)
	expect(ios).toHaveBeenCalledTimes(1)
})

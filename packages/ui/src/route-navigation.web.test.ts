// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Route, RouteManifest } from './props'

const registration = vi.hoisted(() => ({
	listener: null as null | ((name: string, frame: any) => void),
}))

vi.mock('@nativescript/core', () => ({
	Application: { android: null },
	Frame: class {},
	GridLayout: class {},
	Page: class {},
}))

vi.mock('@nativescript-community/octane', () => ({
	createNativeScriptRoot: () => ({ render() {}, unmount() {} }),
}))

vi.mock('./stacks', () => ({
	getStack: () => undefined,
	onStackRegistered(listener: typeof registration.listener) {
		registration.listener = listener
	},
	stackEntries: () => new Map().entries(),
}))

vi.mock('./route-host', () => ({ RouteHost: () => null }))

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => {
		resolve = yes
		reject = no
	})

	return { promise, resolve, reject }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe.each(['web', 'macos', 'native'] as const)('%s navigation ownership', (target) => {
	let router:
		| typeof import('./route.web')
		| typeof import('./route.macos')
		| typeof import('./route')

	beforeAll(async () => {
		router =
			target === 'web'
				? await import('./route.web')
				: target === 'macos'
					? await import('./route.macos')
					: await import('./route.ts')
	}, 60000)

	function setup(slow: Partial<RouteManifest['routes'][number]> = {}) {
		router.registerRoutes({
			screens: { slow: () => null, fast: () => null, redirected: () => null },
			layouts: {},
			routes: ['slow', 'fast', 'redirected'].map((name) => ({
				name,
				file: name,
				segments: [name],
				params: [],
				...(name === 'slow' ? slow : {}),
			})),
		})
	}

	const route = (name: string, stack = 'audit'): Route => ({ name, stack, params: {} })
	if (target === 'native') {
		it('invalidates pending work when a newly registered frame goes back', async () => {
			const wait = deferred<unknown>()
			setup({ loader: () => wait.promise })
			const on = vi.fn()
			registration.listener!('audit', { on, currentPage: null })
			router.pushRoute(route('fast'))
			router.pushRoute(route('slow'))
			on.mock.calls[0][1]({ isBackNavigation: true })
			wait.resolve('old')
			await settle()
			expect(router.routeFor('audit')?.name).toBe('fast')
		})
	}

	it('ignores a superseded loader result', async () => {
		const wait = deferred<unknown>()
		setup({ loader: () => wait.promise })
		router.pushRoute(route('slow'))
		await settle()
		router.pushRoute(route('fast'))
		wait.resolve('old')
		await settle()
		expect(router.routeFor('audit')?.name).toBe('fast')
	})

	it('ignores a superseded loader rejection', async () => {
		const wait = deferred<unknown>()
		setup({ loader: () => wait.promise })
		router.pushRoute(route('slow'))
		await settle()
		router.pushRoute(route('fast'))
		wait.reject(new Error('old'))
		await settle()
		expect(router.routeFor('audit')?.name).toBe('fast')
	})

	it('ignores a superseded guard and its redirect', async () => {
		const wait = deferred<unknown>()
		setup({
			beforeLoad: async () => {
				await wait.promise
				router.redirect(route('redirected'))
			},
		})

		router.pushRoute(route('slow'))
		router.pushRoute(route('fast'))
		wait.resolve(null)
		await settle()
		expect(router.routeFor('audit')?.name).toBe('fast')
	})

	it('preserves active guard context and loader data', async () => {
		setup({ beforeLoad: async () => ({ allowed: true }), loader: async () => 'loaded' })
		router.pushRoute(route('slow'))
		await settle()
		expect(router.routeFor('audit')).toMatchObject({
			name: 'slow',
			context: { allowed: true },
			loaderData: 'loaded',
		})
	})

	it('preserves an active redirect', async () => {
		setup({ beforeLoad: async () => router.redirect(route('redirected')) })
		router.pushRoute(route('slow'))
		await settle()
		expect(router.routeFor('audit')?.name).toBe('redirected')
	})

	it('invalidates pending work when back is requested', async () => {
		const wait = deferred<unknown>()
		setup({ loader: () => wait.promise })
		router.pushRoute(route('fast'))
		router.pushRoute(route('slow'))
		await settle()
		if (target === 'web') {
			vi.spyOn(history, 'back').mockImplementation(() => {})
		}

		router.popRoute('audit')
		const before = router.routeFor('audit')
		wait.resolve('old')
		await settle()
		expect(router.routeFor('audit')).toEqual(before)
		vi.restoreAllMocks()
	})

	it('uses one history on web and independent named stacks elsewhere', async () => {
		const wait = deferred<unknown>()
		setup({ loader: () => wait.promise })
		router.pushRoute(route('slow'))
		await settle()
		router.pushRoute(route('fast', 'other'))
		wait.resolve('loaded')
		await settle()
		expect(router.routeFor('audit')?.name ?? null).toBe(target === 'web' ? null : 'slow')
		expect(router.routeFor('other')?.name ?? null).toBe('fast')
	})
})

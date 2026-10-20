import { useSyncExternalStore } from 'octane'
import { expect, it } from 'vitest'
import { createRouter } from '../src/router-instance'
import { defineRoute } from '../src/define-route'
import { defineRoutes, defineRuntimeRoutes } from '../src/route-table'
import { createStore } from '../src/store'
import { createRouterRenderScope } from '../src/router-render-scope'
import {
	RouterProvider,
	RouterRenderScopeProvider,
	getRouteApi,
	useRouter,
	useRouterState,
	useNavigation,
	useNavigationBlocker,
	useRouteMatch,
	useCanGoBack,
} from '../src/router-hooks.tsrx'

import type {
	PreparedRouteMatch,
	NavigationBlockerState,
	Store,
	RouterHost,
	RouterNavigator,
	RouterNavigationState,
} from '../src/props'

function fixture() {
	const catalog = defineRoutes([
		defineRoute({
			path: '/items/:id',
			validateSearch: (raw) => ({ page: Number(raw.page ?? 1), query: String(raw.query ?? '') }),
			loader: ({ params, search }) => ({ title: params.id, page: search.page }),
		}).screen(() => null),
		defineRoute({ path: '/settings' }).screen(() => null),
	])

	const flows = new Map<string, PreparedRouteMatch>()
	const listeners = new Set<() => void>()
	const host: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot: (flow) => ({
			route: flows.get(flow) ?? null,
			canGoBack: flows.has(flow),
			modal: flow.startsWith('modal:'),
		}),
		subscribe: (listener) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		commit(command) {
			if (!command.beginCommit()) {
				return { status: 'cancelled', reason: 'superseded' }
			}

			if (command.route) {
				flows.set(command.flow, command.route)
			}

			for (const listener of listeners) {
				listener()
			}

			return { status: 'committed', route: flows.get(command.flow) ?? null }
		},
	}

	return createRouter({ catalog, host })
}

type Router = ReturnType<typeof fixture>
type LiveRead = {
	title: string
	page: number
	pending: boolean
	updateSearch: (search: any, options?: { replace?: boolean }) => Promise<unknown>
	navigator: Pick<Router, keyof RouterNavigator<any>>
}

function LiveReader(props: { router: Router; read(value: LiveRead): void }) {
	const api = getRouteApi('/items/:id', props.router)
	const title = api.useLoaderData().title
	const pending = useRouterState(props.router).navigation.status === 'pending'
	const navigator = useRouter(props.router)
	const updateSearch = api.useUpdateSearch()
	expect(api.useParams().id).toBe(title)
	expect(api.useMatch().to).toBe('/items/:id')
	expect(useRouteMatch(props.router)?.to).toBe('/items/:id')
	props.read({ title, page: api.useSearch().page, updateSearch, pending, navigator })
	return null
}

function LiveCase(props: { router: Router; read(value: LiveRead): void }) {
	return (
		<RouterProvider router={props.router}>
			<LiveReader {...props} />
		</RouterProvider>
	)
}

function RetainedReader(props: {
	router: Router
	id: string
	read(id: string, title: string, navigator: RouterNavigator<any>): void
}) {
	const api = getRouteApi('/items/:id', props.router)
	const boundBack = useCanGoBack()
	expect(boundBack).toBe(useRouterState(props.router).canGoBack)
	props.read(props.id, api.useLoaderData().title, useRouter(props.router))
	return null
}

function RetainedCase(props: {
	router: Router
	firstScope: any
	secondScope: any
	read(id: string, title: string, navigator: RouterNavigator<any>): void
}) {
	return (
		<>
			<RouterRenderScopeProvider scope={props.firstScope}>
				<RetainedReader router={props.router} id="left" read={props.read} />
			</RouterRenderScopeProvider>
			<RouterRenderScopeProvider scope={props.secondScope}>
				<RetainedReader router={props.router} id="right" read={props.read} />
			</RouterRenderScopeProvider>
		</>
	)
}

function Missing(props: { errors: string[] }) {
	try {
		useRouter()
	} catch (error) {
		props.errors.push(String(error))
	}

	return null
}

function Wrong(props: { router: Router; other: Router; errors: string[] }) {
	try {
		useRouter()
	} catch (error) {
		props.errors.push(String(error))
	}

	for (const read of [useRouterState, useRouteMatch]) {
		try {
			read()
		} catch (error) {
			props.errors.push(String(error))
		}
	}

	expect(useNavigation()).toEqual(useRouterState(props.router).navigation)

	// This test has no generated ambient registration; exercise the runtime
	// diagnostic without asserting an application contract in the fixture.
	try {
		getRouteApi('/items/:id' as never).useMatch()
	} catch (error) {
		props.errors.push(String(error))
	}

	try {
		useRouter(props.other)
	} catch (error) {
		props.errors.push(String(error))
	}

	try {
		getRouteApi('/settings', props.router).useMatch()
	} catch (error) {
		props.errors.push(String(error))
	}

	return null
}

function DiagnosticCase(props: { router: Router; other: Router; errors: string[] }) {
	return (
		<>
			<Missing errors={props.errors} />
			<RouterProvider router={props.router}>
				<Wrong {...props} />
			</RouterProvider>
		</>
	)
}

function FeedbackReader(props: { read(value: RouterNavigationState): void }) {
	props.read(useNavigation())
	return null
}

function FeedbackCase(props: { router: Router; read(value: RouterNavigationState): void }) {
	return (
		<RouterProvider router={props.router}>
			<FeedbackReader read={props.read} />
		</RouterProvider>
	)
}

function BlockerReader(props: { when: Store<boolean>; read(state: NavigationBlockerState): void }) {
	const when = useSyncExternalStore(
		props.when.subscribe,
		props.when.getSnapshot,
		props.when.getSnapshot,
	)

	props.read(useNavigationBlocker({ when }))
	return null
}

function BlockerCase(props: {
	router: Router
	when: Store<boolean>
	read(state: NavigationBlockerState): void
}) {
	return (
		<RouterProvider router={props.router}>
			<BlockerReader when={props.when} read={props.read} />
		</RouterProvider>
	)
}

function RetainedBlockerCase(props: {
	firstScope: ReturnType<typeof createRouterRenderScope>
	secondScope: ReturnType<typeof createRouterRenderScope>
	firstWhen: Store<boolean>
	secondWhen: Store<boolean>
	read(id: string, state: NavigationBlockerState): void
}) {
	return (
		<>
			<RouterRenderScopeProvider scope={props.firstScope}>
				<BlockerReader when={props.firstWhen} read={(state) => props.read('first', state)} />
			</RouterRenderScopeProvider>
			<RouterRenderScopeProvider scope={props.secondScope}>
				<BlockerReader when={props.secondWhen} read={(state) => props.read('second', state)} />
			</RouterRenderScopeProvider>
		</>
	)
}

type Mounted = { settle(): Promise<void>; unmount(): void }
export function routerScopeCases(mount: (component: (props: any) => any, props: any) => Mounted) {
	it('inherits an explicit provider for confirmation without claiming ambient route DTOs', async () => {
		const router = fixture()
		await router.push({ to: '/items/:id', params: { id: 'coat' } })
		let observed!: NavigationBlockerState
		const rendered = mount(BlockerCase, {
			router,
			when: createStore(true),
			read: (state: NavigationBlockerState) => {
				observed = state
			},
		})

		try {
			await rendered.settle()
			const refused = router.push({ to: '/settings' })
			await rendered.settle()
			expect(observed.status).toBe('blocked')
			if (observed.status !== 'blocked') {
				throw new Error('Expected confirmation')
			}

			const obsolete = observed
			observed.reset()
			expect(await refused).toEqual({ status: 'cancelled', reason: 'aborted' })
			const admitted = router.push({ to: '/settings' })
			await rendered.settle()
			obsolete.proceed()
			expect(router.getSnapshot().route?.to).toBe('/items/:id')
			if (observed.status !== 'blocked') {
				throw new Error('Expected new confirmation')
			}

			observed.proceed()
			expect((await admitted).status).toBe('committed')
			await rendered.settle()
			expect(observed.status).toBe('idle')
		} finally {
			rendered.unmount()
		}

		expect((await router.push({ to: '/items/:id', params: { id: 'hat' } })).status).toBe(
			'committed',
		)

		router.dispose()
	})

	it('keeps an older retained entry with the same href from blocking the current entry', async () => {
		const router = fixture()
		await router.push({ to: '/items/:id', params: { id: 'coat' } })
		const first = createStore<PreparedRouteMatch | null>(router.getSnapshot().route)
		await router.push({ to: '/items/:id', params: { id: 'coat' } })
		const second = createStore<PreparedRouteMatch | null>(router.getSnapshot().route)
		expect(first.getSnapshot()!.href).toBe(second.getSnapshot()!.href)
		expect(first.getSnapshot()).not.toBe(second.getSnapshot())
		const secondWhen = createStore(false)
		const seen = new Map<string, NavigationBlockerState>()
		const rendered = mount(RetainedBlockerCase, {
			firstScope: createRouterRenderScope(router, 'root', first),
			secondScope: createRouterRenderScope(router, 'root', second),
			firstWhen: createStore(true),
			secondWhen,
			read: (id: string, state: NavigationBlockerState) => seen.set(id, state),
		})

		try {
			await rendered.settle()
			const request = router.push({ to: '/settings' })
			await rendered.settle()
			expect(seen.get('first')!.status).toBe('idle')
			expect((await request).status).toBe('committed')
			second.set(router.getSnapshot().route)
			secondWhen.set(true)
			await rendered.settle()
			const blocked = router.push({ to: '/items/:id', params: { id: 'hat' } })
			await rendered.settle()
			expect(seen.get('first')!.status).toBe('idle')
			const visible = seen.get('second')!
			expect(visible.status).toBe('blocked')
			if (visible.status !== 'blocked') {
				throw new Error('Expected current-entry confirmation')
			}

			visible.proceed()
			expect((await blocked).status).toBe('committed')
		} finally {
			rendered.unmount()
			router.dispose()
		}
	})

	it('cancels a held attempt when the condition is cleared and accepts later navigation', async () => {
		const router = fixture()
		const when = createStore(true)
		let observed!: NavigationBlockerState
		const rendered = mount(BlockerCase, {
			router,
			when,
			read: (state: NavigationBlockerState) => {
				observed = state
			},
		})

		try {
			await rendered.settle()
			const held = router.push({ to: '/settings' })
			await rendered.settle()
			expect(observed.status).toBe('blocked')
			when.set(false)
			await rendered.settle()
			expect(await held).toEqual({ status: 'cancelled', reason: 'aborted' })
			expect(observed.status).toBe('idle')
			expect((await router.push({ to: '/settings' })).status).toBe('committed')
		} finally {
			rendered.unmount()
			router.dispose()
		}
	})

	it('keeps proceeding through a save-condition update until approved navigation settles', async () => {
		const router = fixture()
		let release!: () => void
		const waiting = new Promise<void>((resolve) => {
			release = resolve
		})

		const registration = router.addRoutes(
			defineRuntimeRoutes([
				defineRoute({ path: '/waiting-save', loader: () => waiting }).screen(() => null),
			]),
			{ id: 'save-confirmation' },
		)

		const when = createStore(true)
		let observed!: NavigationBlockerState
		const rendered = mount(BlockerCase, {
			router,
			when,
			read: (state: NavigationBlockerState) => {
				observed = state
			},
		})

		try {
			await rendered.settle()
			const pending = router.navigateUrl('/waiting-save')
			await rendered.settle()
			if (observed.status !== 'blocked') {
				throw new Error('Expected confirmation')
			}

			observed.proceed()
			when.set(false)
			await rendered.settle()
			expect(observed.status).toBe('proceeding')
			expect(router.getSnapshot().navigation.status).toBe('pending')
			release()
			expect((await pending).status).toBe('committed')
			await rendered.settle()
			expect(observed.status).toBe('idle')
		} finally {
			release()
			rendered.unmount()
			registration.dispose()
			router.dispose()
		}
	})

	it('releases a held confirmation on unmount without disposing its router', async () => {
		const router = fixture()
		const rendered = mount(BlockerCase, { router, when: createStore(true), read: () => {} })
		await rendered.settle()
		const held = router.push({ to: '/settings' })
		await rendered.settle()
		rendered.unmount()
		expect(await held).toEqual({ status: 'cancelled', reason: 'aborted' })
		expect((await router.push({ to: '/settings' })).status).toBe('committed')
		router.dispose()
	})

	it('updates inherited navigation feedback without exposing another catalog DTO', async () => {
		const router = fixture()
		let reject!: (error: Error) => void
		const waiting = new Promise<never>((_resolve, fail) => {
			reject = fail
		})

		const registration = router.addRoutes(
			defineRuntimeRoutes([
				defineRoute({ path: '/waiting', loader: () => waiting }).screen(() => null),
			]),
			{ id: 'feedback-waiting' },
		)

		let observed!: RouterNavigationState
		const rendered = mount(FeedbackCase, {
			router,
			read: (value: RouterNavigationState) => {
				observed = value
			},
		})

		try {
			await rendered.settle()
			expect(observed).toEqual({ status: 'idle' })
			const request = router.navigateUrl('/waiting')
			await rendered.settle()
			expect(observed).toMatchObject({ status: 'pending', destination: { to: '/waiting' } })
			reject(new Error('Expected feedback failure'))
			expect(await request).toMatchObject({ status: 'failed', phase: 'loader' })
			await rendered.settle()
			expect(observed).toMatchObject({
				status: 'failed',
				result: { status: 'failed', phase: 'loader' },
			})

			router.clearFailure()
			await rendered.settle()
			expect(observed).toEqual({ status: 'idle' })
		} finally {
			rendered.unmount()
			registration.dispose()
			router.dispose()
		}
	})

	it('binds typed search callbacks to the rendering entry across updates and stale closures', async () => {
		const router = fixture()
		await router.push({ to: '/items/:id', params: { id: 'coat' }, search: { page: 2 } })
		let observed!: LiveRead
		const rendered = mount(LiveCase, {
			router,
			read: (value: LiveRead) => {
				observed = value
			},
		})

		try {
			await rendered.settle()
			const originalUpdate = observed.updateSearch
			expect(await originalUpdate((previous: any) => ({ page: previous.page + 1 }))).toMatchObject({
				status: 'committed',
			})

			await rendered.settle()
			expect(observed.page).toBe(3)
			expect(router.getSnapshot().route?.data).toEqual({ title: 'coat', page: 3 })
			expect(await originalUpdate({ page: 9 })).toEqual({
				status: 'cancelled',
				reason: 'superseded',
			})

			await observed.updateSearch({ page: 4 }, { replace: false })
			await rendered.settle()
			expect(observed.page).toBe(4)
		} finally {
			rendered.unmount()
			router.dispose()
		}
	})

	it('subscribes unchanged-prop readers and exposes bound operations without instance disposal', async () => {
		const router = fixture()
		await router.push({ to: '/items/:id', params: { id: 'coat' } })
		let observed!: LiveRead
		const rendered = mount(LiveCase, {
			router,
			read: (value: LiveRead) => {
				observed = value
			},
		})

		try {
			await rendered.settle()
			expect(observed.title).toBe('coat')
			expect('dispose' in observed.navigator).toBe(false)
			await observed.navigator.push({ to: '/items/:id', params: { id: 'hat' } })
			await rendered.settle()
			expect(observed.title).toBe('hat')
			expect(observed.pending).toBe(false)
		} finally {
			rendered.unmount()
		}

		expect((await router.push({ to: '/settings' })).status).toBe('committed')
		router.dispose()
	})

	it('keeps retained entry data and flow ownership independent of the latest destination', async () => {
		const router = fixture()
		await router.push({ to: '/items/:id', params: { id: 'coat' } })
		const original = router.getSnapshot().route!
		const first = createStore<PreparedRouteMatch | null>(original)
		const second = createStore<PreparedRouteMatch | null>({
			...original,
			params: { id: 'hat' },
			data: { title: 'hat' },
		})

		const firstScope = createRouterRenderScope(router, 'left', first)
		const secondScope = createRouterRenderScope(router, 'right', second)
		const seen = new Map<string, string>()
		const navigators = new Map<string, RouterNavigator<any>>()
		const rendered = mount(RetainedCase, {
			router,
			firstScope,
			secondScope,
			read: (id: string, title: string, navigator: RouterNavigator<any>) => {
				seen.set(id, title)
				navigators.set(id, navigator)
			},
		})

		try {
			await rendered.settle()
			await navigators.get('right')!.push({ to: '/settings' })
			await router.push({ to: '/items/:id', params: { id: 'scarf' } })
			await rendered.settle()
			expect(seen).toEqual(
				new Map([
					['left', 'coat'],
					['right', 'hat'],
				]),
			)

			expect(navigators.get('right')!.getSnapshot().route?.to).toBe('/settings')
			expect(navigators.get('left')!.getSnapshot().route).toBeNull()
			first.set({ ...original, data: { title: 'updated coat' } })
			await rendered.settle()
			expect(seen.get('left')).toBe('updated coat')
			expect(seen.get('right')).toBe('hat')
		} finally {
			rendered.unmount()
			router.dispose()
		}
	})

	it('diagnoses missing scope, wrong instance and wrong rendering route', async () => {
		const router = fixture()
		const other = fixture()
		const errors: string[] = []
		const rendered = mount(DiagnosticCase, { router, other, errors })
		try {
			await rendered.settle()
			expect(errors.some((error) => error.includes('require a RouterProvider'))).toBe(true)
			expect(errors.some((error) => error.includes('different router instance'))).toBe(true)
			expect(
				errors.filter((error) => error.includes('explicit router instance')).length,
			).toBeGreaterThanOrEqual(4)

			expect(errors.some((error) => error.includes("'/settings' is not the rendering match"))).toBe(
				true,
			)
		} finally {
			rendered.unmount()
			router.dispose()
			other.dispose()
		}
	})
}

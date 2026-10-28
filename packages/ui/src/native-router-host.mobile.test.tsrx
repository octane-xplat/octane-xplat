/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { useState } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

const native = vi.hoisted(() => {
	const activity = {}
	const backEvents = new Map<string, (event: any) => void>()
	const Application: any = {
		android: { on: (name: string, callback: any) => backEvents.set(name, callback) },
		AndroidApplication: { activityBackPressedEvent: 'back' },
	}

	class Page {
		actionBarHidden = false
		content: any
		frame: any
		ios: any = {}
		createNativeView() {
			this.ios = {}
			return {}
		}
		disposeNativeView() {
			this.ios = null
		}
	}

	class Frame {
		android = { activity }
		currentPage = new Page()
		currentEntry: any = {}
		backStack: any[] = []
		isLoaded = true
		listeners = new Map<string, Set<(event: any) => void>>()
		pending: { page: Page; args: any; action: string; back?: any } | undefined
		on(name: string, listener: (event: any) => void) {
			const values = this.listeners.get(name) ?? new Set()
			values.add(listener)
			this.listeners.set(name, values)
		}
		off(name: string, listener: (event: any) => void) {
			this.listeners.get(name)?.delete(listener)
		}
		emit(name: string, event: any) {
			for (const listener of [...(this.listeners.get(name) ?? [])]) {
				listener(event)
			}
		}
		callLoaded() {
			this.isLoaded = true
		}
		canGoBack() {
			return this.backStack.length > 0
		}
		navigate(args: any) {
			this.stage(args, 'push')
		}
		replacePage(args: any) {
			this.stage(args, 'replace')
		}
		goBack(back: any) {
			this.stage({ create: () => back.resolvedPage }, 'back', back)
		}
		stage(args: any, action: string, back?: any) {
			const page = args.create()
			if (!page.ios) {
				throw new Error('Required page does not have a viewController created.')
			}

			this.pending = { page, args, action, back }
			this.emit('navigatingTo', { entry: { resolvedPage: page } })
		}
		complete() {
			const pending = this.pending!
			this.pending = undefined
			const removed =
				pending.action === 'back'
					? [
							...this.backStack
								.slice(this.backStack.indexOf(pending.back) + 1)
								.map((entry) => entry.resolvedPage),
							this.currentPage,
						]
					: pending.args.clearHistory
						? [...this.backStack.map((entry) => entry.resolvedPage), this.currentPage]
						: pending.action === 'replace'
							? [this.currentPage]
							: []

			for (const page of removed) {
				if (page !== pending.page) {
					page.disposeNativeView()
				}
			}

			if (pending.action === 'back') {
				this.backStack.splice(this.backStack.indexOf(pending.back))
			} else if (pending.args.clearHistory) {
				this.backStack = []
			} else if (pending.action !== 'replace') {
				this.backStack.push({ resolvedPage: this.currentPage })
			}

			this.currentEntry = pending.action === 'back' ? (pending.page as any).entry : pending.args

			;(pending.page as any).entry = this.currentEntry
			this.currentPage = pending.page
			this.currentPage.frame = this
			this.emit('navigatedTo', { entry: { resolvedPage: pending.page } })
		}
	}

	return { Frame, Page, GridLayout: class {}, Application, activity, backEvents }
})

vi.mock('@nativescript/core', () => ({ ...native, isIOS: false }))
vi.mock('./native-portal', () => ({ createPortal: (children: any) => children }))
import { createNativeRouterHost } from './native-router-host'
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { defineTransitions } from './route-transitions'
import { defineNativeTransition } from './native-route-transition'
import { getRouteApi } from './router-hooks.tsrx'
import { RouteForbidden, DestinationRedirect } from './routing-core'
import type { RouterInstance, TransitionRegistry } from './props'

let navigation: RouterInstance<any>
const frameEntries = new Map<string, { title: string; count: number; increment(): void }>()
const frameRenderFailures = new Set<string>()
function Item() {
	const item = getRouteApi('/items/:id', navigation)
	const id = item.useParams().id
	if (frameRenderFailures.has(id)) {
		throw new Error('History target render failed')
	}

	const title = item.useLoaderData().title
	const [count, setCount] = useState(0)
	frameEntries.set(id, { title, count, increment: () => setCount((value) => value + 1) })
	return <label text={id + ':' + title} />
}

function Broken() {
	throw new Error('native render failed')
}

let removeOwner = () => {}
let restoreOwner = () => {}
function App(props: { platform: ReturnType<typeof createNativeRouterHost> }) {
	const [owned, setOwned] = useState(true)
	removeOwner = () => setOwned(false)
	restoreOwner = () => setOwned(true)
	return owned ? <ClientRouteOutlet host={props.platform} /> : <label text="outside" />
}

const tick = async () => {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

async function until(condition: () => boolean) {
	for (let i = 0; i < 100 && !condition(); i++) {
		await tick()
	}

	expect(condition()).toBe(true)
}

function fixture<const Effects extends TransitionRegistry = {}>(
	timeout = 1000,
	ready = true,
	effects?: Effects,
	behavior?: { guard?(id: string): void | Promise<void>; title?(id: string): string },
) {
	frameEntries.clear()
	frameRenderFailures.clear()
	const frame = new native.Frame()
	if (!ready) {
		;(frame as any).currentPage = undefined
	}

	const platform = createNativeRouterHost({
		getFrame: () => frame as any,
		navigationTimeoutMs: timeout,
	})

	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad: ({ params }) => behavior?.guard?.(params.id),
				loader: ({ params }) => ({
					title: behavior?.title?.(params.id) ?? params.id.toUpperCase(),
				}),
			}).screen(Item),
		]),
		host: platform.host,
		transitions: effects,
	})

	navigation = router
	platform.attach(router)
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	root.render(App, { platform })
	return {
		frame,
		router,
		platform,
		root,
		async drive(promise: ReturnType<typeof router.push>) {
			await until(() => !!frame.pending)
			frame.complete()
			await tick()
			return promise
		},
		close() {
			root.unmount()
			for (let i = 0; i < 3 && frame.pending; i++) {
				frame.complete()
			}

			router.dispose()
		},
	}
}

it('waits for actual currentPage confirmation after staged content rendering', async () => {
	const test = fixture()
	const base = test.frame.currentPage
	try {
		let settled = false
		const pending = test.router
			.push({ to: '/items/:id', params: { id: 'coat' } })
			.then((result) => {
				settled = true
				return result
			})

		await until(() => !!test.frame.pending)
		expect(test.frame.currentPage).toBe(base)
		expect(settled).toBe(false)
		test.frame.complete()
		expect((await pending).status).toBe('committed')
		expect(test.router.getSnapshot().route?.data).toEqual({ title: 'COAT' })
	} finally {
		test.close()
	}
})

function lateFrameFixture(timeout = 1000) {
	frameEntries.clear()
	frameRenderFailures.clear()
	const listeners = new Set<(flow: string) => void>()
	const state: { frame?: native.Frame } = {}
	const platform = createNativeRouterHost({
		getFrame: () => state.frame as any,
		onFrameChange: (listener) => {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
		navigationTimeoutMs: timeout,
	})

	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/items/:id',
				loader: ({ params }) => ({ title: params.id.toUpperCase() }),
			}).screen(Item),
		]),
		host: platform.host,
	})

	navigation = router
	platform.attach(router)
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	root.render(App, { platform })
	return {
		state,
		router,
		notify() {
			for (const listener of listeners) {
				listener('root')
			}
		},
		async drive(promise: ReturnType<typeof router.push>) {
			await until(() => !!state.frame?.pending)
			state.frame!.complete()
			await tick()
			return promise
		},
		close() {
			root.unmount()
			for (let i = 0; i < 3 && state.frame?.pending; i++) {
				state.frame.complete()
			}

			router.dispose()
		},
	}
}

it('binds a Frame announced after the outlet mounted', async () => {
	const test = lateFrameFixture()
	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'late' } })
		test.state.frame = new native.Frame()
		test.notify()
		expect((await test.drive(pending)).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('picks up an unannounced Frame at the next commit', async () => {
	const test = lateFrameFixture()
	try {
		test.state.frame = new native.Frame()
		const pending = test.router.push({ to: '/items/:id', params: { id: 'late' } })
		expect((await test.drive(pending)).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('moves readiness from an unready Frame to its replacement', async () => {
	const test = lateFrameFixture()
	try {
		const stale = new native.Frame()

		;(stale as any).currentPage = undefined
		test.state.frame = stale
		test.notify()
		test.state.frame = new native.Frame()
		test.notify()
		const pending = test.router.push({ to: '/items/:id', params: { id: 'late' } })
		expect((await test.drive(pending)).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('waits for the initial Frame receipt before accepting a cold navigation', async () => {
	const test = fixture(1000, false)
	try {
		let settled = false
		const pending = test.router
			.push({ to: '/items/:id', params: { id: 'cold' } })
			.then((result) => {
				settled = true
				return result
			})

		await tick()
		expect(test.frame.pending).toBeUndefined()
		expect(settled).toBe(false)
		test.frame.currentPage = new native.Page()
		test.frame.emit('navigatedTo', { entry: { resolvedPage: test.frame.currentPage } })
		expect((await test.drive(pending)).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('cancels initial Frame waits on owner removal and ignores late readiness', async () => {
	const test = fixture(1000, false)
	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'cold' } })
		await tick()
		removeOwner()
		await tick()
		expect(await pending).toMatchObject({ status: 'cancelled', reason: 'aborted' })
		test.frame.currentPage = new native.Page()
		test.frame.emit('navigatedTo', {})
		await tick()
		expect(test.frame.pending).toBeUndefined()
	} finally {
		test.close()
	}
})

it('supersedes an unaccepted cold navigation while sharing the host readiness receipt', async () => {
	const test = fixture(1000, false)
	try {
		const first = test.router.push({ to: '/items/:id', params: { id: 'old' } })
		await tick()
		const second = test.router.push({ to: '/items/:id', params: { id: 'new' } })
		expect(await first).toMatchObject({ status: 'cancelled', reason: 'superseded' })
		test.frame.currentPage = new native.Page()
		test.frame.emit('navigatedTo', {})
		expect((await test.drive(second)).status).toBe('committed')
		expect(test.router.getSnapshot().route?.params.id).toBe('new')
		expect(test.frame.backStack).toHaveLength(1)
	} finally {
		test.close()
	}
})

it('bounds initial Frame readiness rather than leaving navigation pending forever', async () => {
	const test = fixture(20, false)
	try {
		expect(await test.router.push({ to: '/items/:id', params: { id: 'cold' } })).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(test.frame.pending).toBeUndefined()
	} finally {
		test.close()
	}
})

it('retains prepared Back entries and uses native replacement/reset semantics', async () => {
	const test = fixture()
	try {
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		const coat = test.frame.currentPage
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		await test.drive(test.router.back())
		expect(test.frame.currentPage).toBe(coat)
		expect(test.router.getSnapshot().route?.params.id).toBe('coat')
		await test.drive(test.router.replace({ to: '/items/:id', params: { id: 'cap' } }))
		expect(test.frame.backStack).toHaveLength(1)
		await test.drive(test.router.reset({ to: '/items/:id', params: { id: 'glove' } }))
		expect(test.frame.backStack).toHaveLength(0)
		expect(test.router.getSnapshot().canGoBack).toBe(false)
	} finally {
		test.close()
	}
})

it('settles missing native callbacks without claiming to undo accepted native work', async () => {
	const test = fixture(30)
	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'coat' } })
		await until(() => !!test.frame.pending)
		expect(await pending).toMatchObject({ status: 'failed', phase: 'commit' })
		// NativeScript can still deliver the accepted operation after a timeout.
		test.frame.complete()
		expect(test.router.getSnapshot().route?.params.id).toBe('coat')
	} finally {
		test.close()
	}
})

it('rejects a rendering failure before mutating the Frame', async () => {
	const test = fixture()
	try {
		test.router.addRoutes(
			defineRoutes([defineRoute({ path: '/render-failure/:id' }).screen(Broken)]),
			{
				id: 'broken',
				conflict: 'replace',
			},
		)

		expect(
			await test.router.push({ to: '/render-failure/:id', params: { id: 'coat' } }),
		).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(test.frame.pending).toBeUndefined()
	} finally {
		test.close()
	}
})

it('returns to the declaring base when an owner leaves after reset', async () => {
	const test = fixture()
	const base = test.frame.currentPage
	try {
		await test.drive(test.router.reset({ to: '/items/:id', params: { id: 'coat' } }))
		removeOwner()
		await tick()
		expect(test.frame.pending?.page).toBe(base)
		test.frame.complete()
		expect(test.frame.currentPage).toBe(base)
	} finally {
		test.router.dispose()
	}
})

it('returns an accepted in-flight Page to its owner without leaving a blank orphan', async () => {
	const test = fixture()
	const base = test.frame.currentPage
	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'coat' } })
		await until(() => !!test.frame.pending)
		test.root.unmount()
		expect(await pending).toMatchObject({ status: 'cancelled' })
		test.frame.complete()
		expect(test.frame.pending?.page).toBe(base)
		test.frame.complete()
		expect(test.frame.currentPage).toBe(base)
	} finally {
		test.router.dispose()
	}
})

it('removes readiness observers when disposed before the initial Page commits', () => {
	const test = fixture(1000, false)
	try {
		expect(test.frame.listeners.get('navigatedTo')?.size).toBe(1)
		test.router.dispose()
		expect(test.frame.listeners.get('navigatedTo')?.size).toBe(0)
	} finally {
		test.root.unmount()
	}
})

it('returns an owner cleanup receipt only after the declaring Page is current again', async () => {
	const { createContentOwner } = await import('./owned-content')
	const frame = new native.Frame()
	const base = frame.currentPage
	const platform = createNativeRouterHost({ getFrame: () => frame as any })
	const router = createRouter({ catalog: defineRoutes([]), host: platform.host })
	platform.attach(router)
	const owner = createContentOwner()
	const detach = platform.mount('root', owner)
	frame.currentPage = new native.Page()
	frame.backStack = [{ resolvedPage: base }]
	let returned = false
	try {
		const receipt = detach().then(() => {
			returned = true
		})

		await tick()
		expect(returned).toBe(false)
		expect(frame.pending?.page).toBe(base)
		frame.complete()
		await receipt
		expect(returned).toBe(true)
		expect(frame.currentPage).toBe(base)
	} finally {
		owner.dispose()
		router.dispose()
	}
})

it('keeps Back at the declaring base when the Frame contains earlier unowned history', async () => {
	const test = fixture()
	const base = test.frame.currentPage
	const previous = new native.Page()
	test.frame.backStack.push({ resolvedPage: previous })
	try {
		await tick()
		expect(test.frame.canGoBack()).toBe(true)
		expect(test.router.getSnapshot().canGoBack).toBe(false)
		expect(await test.router.back()).toEqual({ status: 'at-base' })
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		expect(test.router.getSnapshot().canGoBack).toBe(true)
		await test.drive(test.router.back())
		expect(test.frame.currentPage).toBe(base)
		expect(test.frame.backStack).toHaveLength(1)
		expect(test.router.getSnapshot().canGoBack).toBe(false)
	} finally {
		test.close()
	}
})

it('consumes Android Back while the first accepted Page is still navigating', async () => {
	const test = fixture()
	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'coat' } })
		await until(() => !!test.frame.pending)
		const event = { cancel: false, activity: native.activity, object: native.Application }
		native.backEvents.get('back')!(event)
		expect(event.cancel).toBe(true)
		expect(test.frame.pending).toBeDefined()
		test.frame.complete()
		expect((await pending).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('does not mutate the Frame when a staged composition barrier fails', async () => {
	const test = fixture()
	const original = test.platform.host.commit.bind(test.platform.host)
	test.platform.host.commit = (command) =>
		original({
			...command,
			beforeMutation: () => {
				throw new Error('surface cleanup failed')
			},
		})

	try {
		expect(await test.router.push({ to: '/items/:id', params: { id: 'coat' } })).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(test.frame.pending).toBeUndefined()
		expect(test.frame.backStack).toHaveLength(0)
		expect(test.router.getSnapshot().route).toBeNull()
	} finally {
		test.close()
	}
})

it('rechecks disposal after a staged composition barrier completes', async () => {
	const test = fixture()
	let release!: () => void
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	let waiting = false
	const original = test.platform.host.commit.bind(test.platform.host)
	test.platform.host.commit = (command) =>
		original({
			...command,
			beforeMutation: () => {
				waiting = true
				return barrier
			},
		})

	try {
		const pending = test.router.push({ to: '/items/:id', params: { id: 'coat' } })
		await until(() => waiting)
		expect(test.frame.pending).toBeUndefined()
		test.router.dispose()
		release()
		expect(await pending).toMatchObject({ status: 'cancelled', reason: 'disposed' })
		await tick()
		expect(test.frame.pending).toBeUndefined()
		expect(test.frame.backStack).toHaveLength(0)
	} finally {
		release()
		test.close()
	}
})

it('selects a registered native engine transition once and leaves Back reversal to its Frame', async () => {
	const page = vi.fn(() => ({ name: 'slideLeft', duration: 240 }))
	const f = fixture(1000, true, defineTransitions({ detail: defineNativeTransition({ page }) }))
	try {
		const push = f.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'detail' })
		await until(() => !!f.frame.pending)
		expect(f.frame.pending!.args.transition).toEqual({ name: 'slideLeft', duration: 240 })
		expect(f.frame.pending!.args.animated).toBe(true)
		expect(page).toHaveBeenCalledOnce()
		expect(page.mock.calls[0][0]).toMatchObject({
			action: 'push',
			from: null,
			to: { params: { id: 'coat' } },
		})

		f.frame.complete()
		const result = await push
		expect(result.status === 'committed' && (await result.finished)).toEqual({
			status: 'completed',
		})

		expect((await f.drive(f.router.back())).status).toBe('committed')
		expect(page).toHaveBeenCalledOnce()
	} finally {
		f.close()
	}
})

it('commits without animation when a native factory throws and exposes its separate failure', async () => {
	const error = new Error('native effect failed')
	const f = fixture(
		1000,
		true,
		defineTransitions({
			detail: defineNativeTransition({
				page: () => {
					throw error
				},
			}),
		}),
	)

	try {
		const push = f.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'detail' })
		await until(() => !!f.frame.pending)
		expect(f.frame.pending!.args.animated).toBe(false)
		f.frame.complete()
		const result = await push
		expect(result.status === 'committed' && (await result.finished)).toEqual({
			status: 'failed',
			error,
		})

		expect(f.router.getSnapshot().route?.params.id).toBe('coat')
	} finally {
		f.close()
	}
})

it('does not mutate a Frame after an application transition factory disposes its router', async () => {
	let dispose = () => {}
	const f = fixture(
		1000,
		true,
		defineTransitions({
			detail: defineNativeTransition({
				page: () => {
					dispose()
					return { name: 'fade' }
				},
			}),
		}),
	)

	dispose = () => f.router.dispose()
	const base = f.frame.currentPage
	try {
		expect(
			await f.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'detail' }),
		).toEqual({ status: 'cancelled', reason: 'disposed' })

		expect(f.frame.pending).toBeUndefined()
		expect(f.frame.currentPage).toBe(base)
	} finally {
		f.close()
	}
})

it('waits for the old Frame owner to restore its base before a remounted owner navigates', async () => {
	const test = fixture()
	const base = test.frame.currentPage
	try {
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		removeOwner()
		await tick()
		expect(test.frame.pending?.page).toBe(base)
		restoreOwner()
		await tick()
		let settled = false
		const next = test.router.push({ to: '/items/:id', params: { id: 'hat' } }).then((result) => {
			settled = true
			return result
		})

		await tick()
		expect(settled).toBe(false)
		expect(test.frame.pending?.page).toBe(base)
		test.frame.complete()
		await until(() => !!test.frame.pending)
		expect(test.frame.pending!.page).not.toBe(base)
		test.frame.complete()
		expect((await next).status).toBe('committed')
		expect(test.router.getSnapshot().route?.params.id).toBe('hat')
	} finally {
		test.close()
	}
})

it('rechecks a retained Frame Page before popping and refreshes its data without losing local state', async () => {
	let allowed = true
	let account = 'a'
	const test = fixture(1000, true, undefined, {
		guard() {
			if (!allowed) {
				throw new RouteForbidden()
			}
		},
		title: (id) => account + ':' + id,
	})

	try {
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		const coat = test.frame.currentPage
		frameEntries.get('coat')!.increment()
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		const hat = test.frame.currentPage
		allowed = false
		account = 'b'
		expect(await test.router.back()).toEqual({ status: 'forbidden' })
		expect(test.frame.currentPage).toBe(hat)
		expect(test.frame.pending).toBeUndefined()
		expect(frameEntries.get('coat')).toMatchObject({ title: 'a:coat', count: 1 })
		allowed = true
		expect((await test.drive(test.router.retry())).status).toBe('committed')
		expect(test.frame.currentPage).toBe(coat)
		expect(frameEntries.get('coat')).toMatchObject({ title: 'b:coat', count: 1 })
	} finally {
		test.close()
	}
})

it('redirects Frame Back into the retained Page with a fresh screen identity', async () => {
	let redirect = false
	const test = fixture(1000, true, undefined, {
		guard(id) {
			if (redirect && id === 'coat') {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'cap' } })
			}
		},
	})

	try {
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		const coat = test.frame.currentPage
		frameEntries.get('coat')!.increment()
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		redirect = true
		const result = await test.drive(test.router.back())
		expect(result.status === 'committed' && result.redirected).toBe(true)
		expect(test.frame.currentPage).toBe(coat)
		expect(test.router.getSnapshot().route?.params.id).toBe('cap')
		expect(frameEntries.get('cap')).toMatchObject({ title: 'CAP', count: 0 })
		expect(test.frame.backStack).toHaveLength(1)
	} finally {
		test.close()
	}
})

it('preserves a retained target when a redirected Frame history screen fails to render', async () => {
	let redirect = false
	const test = fixture(1000, true, undefined, {
		guard(id) {
			if (redirect && id === 'coat') {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'cap' } })
			}
		},
	})

	try {
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		const coat = test.frame.currentPage
		frameEntries.get('coat')!.increment()
		await tick()
		await test.drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		const hat = test.frame.currentPage
		redirect = true
		frameRenderFailures.add('cap')
		const pending = test.router.back()
		let settled = false
		void pending.then(() => {
			settled = true
		})

		await until(() => settled)
		expect(await pending).toMatchObject({ status: 'failed', phase: 'commit' })
		await tick()
		expect(test.frame.currentPage).toBe(hat)
		expect(test.frame.backStack.at(-1)?.resolvedPage).toBe(coat)
		expect(frameEntries.get('coat')?.count).toBe(1)
	} finally {
		test.close()
	}
})

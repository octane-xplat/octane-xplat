/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot, useState } from 'octane'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createRouter, bindRouterFlow } from './router-instance'
import { createNavigationBlocker, registerNavigationBlocker } from './navigation-blocker'
import { DestinationRedirect, RouteForbidden } from './routing-core'
import { defineRoute } from './define-route'
import { defineRoutes, defineRuntimeRoutes } from './route-table'
import { createBrowserRouterHost } from './browser-router-host.web'
import { ClientRouteOutlet } from './ClientRouteOutlet.web.tsrx'
import { useRouter } from './router-hooks.tsrx'
import { setThemePreference } from '../theme/theme-scheme'
import type { RouterInstance } from '../props'

let active: RouterInstance<any>
let observedNavigator: ReturnType<typeof useRouter<any>>
function Item(props: { params: { id: string }; data: { title: string } }) {
	const [count, setCount] = useState(0)
	observedNavigator = useRouter(active)
	return (
		<button id="item" onClick={() => setCount(count + 1)}>
			{props.params.id}:{props.data.title}:{count}
		</button>
	)
}

function Settings() {
	observedNavigator = useRouter(active)
	return <p id="settings">Settings</p>
}

function App(props: { platform: ReturnType<typeof createBrowserRouterHost> }) {
	return (
		<ClientRouteOutlet host={props.platform}>
			<p id="base">Base</p>
		</ClientRouteOutlet>
	)
}

const cleanups: (() => void)[] = []
beforeEach(() => {
	history.replaceState(null, '', '/')
	vi.stubGlobal('matchMedia', (media: string) => ({
		media,
		matches: false,
		addEventListener() {},
		removeEventListener() {},
	}))
})

afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) {
		cleanup()
	}

	vi.unstubAllGlobals()
})

const settle = () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 20))
	})

function visibleText(container: Element): string {
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
	let result = ''
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		let hidden = false
		for (let parent = node.parentElement; parent; parent = parent.parentElement) {
			if (parent.hidden || getComputedStyle(parent).display === 'none') {
				hidden = true
				break
			}

			if (parent === container) {
				break
			}
		}

		if (!hidden) {
			result += node.textContent
		}
	}

	return result
}

function fixture(readTitle: (id: string, load: number) => string = (id, load) => id + load) {
	const platform = createBrowserRouterHost()
	let loads = 0
	// This protocol fixture deliberately exercises replaceable runtime layers.
	// Declared-contract immutability is covered by router-instance.test.ts.
	const catalog = defineRuntimeRoutes([
		defineRoute({
			path: '/items/:id',
			loader: ({ params }) => ({ title: readTitle(params.id, ++loads) }),
		}).screen(Item),
		defineRoute({ path: '/settings' }).screen(Settings),
	])

	const router: RouterInstance<any> = createRouter({
		catalog,
		host: platform.host,
		stacks: ['left', 'right'],
	})

	active = router
	platform.attach(router)
	cleanups.push(() => router.dispose())
	const mount = (component = App) => {
		const container = document.createElement('div')
		document.body.append(container)
		const root = createRoot(container)
		act(() => root.render(component, { platform }))
		cleanups.push(() => {
			act(() => root.unmount())
			container.remove()
		})

		return container
	}

	return { platform, router, mount, catalog }
}

it('requires a mounted host and resolves navigation after the destination DOM commits', async () => {
	const { router, mount } = fixture()
	const url = location.href
	expect(await router.push({ to: '/settings' })).toEqual({ status: 'blocked' })
	expect(location.href).toBe(url)
	const container = mount()
	const result = await router.push({ to: '/items/:id', params: { id: 'coat' } })
	expect(result.status).toBe('committed')
	expect(location.pathname).toBe('/items/coat')
	expect(container.querySelector('#item')?.textContent).toBe('coat:coat1:0')
	expect(observedNavigator.getSnapshot().route?.params).toEqual({ id: 'coat' })
	if (result.status === 'committed') {
		expect(await result.finished).toEqual({ status: 'skipped', reason: 'disabled' })
	}

	expect(await router.reset({ to: '/settings' })).toEqual({
		status: 'unsupported',
		operation: 'reset',
	})
})

it('refreshes without remounting, replaces history, and renders actual Back/Forward traversal', async () => {
	const { router, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'fade' })
	act(() => (container.querySelector('#item') as HTMLButtonElement).click())
	expect(visibleText(container)).toBe('coat:coat1:1')
	const refreshed = await router.refresh()
	expect(router.getSnapshot().route?.transition).toBe('fade')
	if (refreshed.status === 'committed') {
		expect(await refreshed.finished).toEqual({ status: 'skipped', reason: 'disabled' })
	}

	expect(visibleText(container)).toBe('coat:coat2:1')
	await router.replace({ to: '/items/:id', params: { id: 'hat' } })
	expect(visibleText(container)).toBe('hat:hat3:0')
	expect((await router.back()).status).toBe('committed')
	expect(location.pathname).toBe('/')
	expect(container.querySelector('#base')).not.toBeNull()
	history.forward()
	await settle()
	expect(location.pathname).toBe('/items/hat')
	expect(visibleText(container)).toBe('hat:hat4:0')
})

function BaseCounter() {
	const [count, setCount] = useState(0)
	return (
		<button id="base-counter" onClick={() => setCount(count + 1)}>
			Base {count}
		</button>
	)
}

function CounterApp(props: { platform: ReturnType<typeof createBrowserRouterHost> }) {
	return (
		<ClientRouteOutlet host={props.platform}>
			<BaseCounter />
		</ClientRouteOutlet>
	)
}

it('retains the browser shell DOM and local state beneath root navigation', async () => {
	const { router, mount } = fixture()
	const container = mount(CounterApp)
	const counter = container.querySelector('#base-counter') as HTMLButtonElement
	act(() => counter.click())
	expect(visibleText(container)).toBe('Base 1')
	await router.push({ to: '/settings' })
	expect(container.querySelector('#base-counter')).toBe(counter)
	expect(visibleText(container)).toBe('Settings')
	expect((await router.back()).status).toBe('committed')
	expect(container.querySelector('#base-counter')).toBe(counter)
	expect(visibleText(container)).toBe('Base 1')
})

it('gives a multistep modal its own navigator and dismisses the whole flow', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/items/:id', params: { id: 'hat' }, presentation: 'modal' })
	const modalNavigator = observedNavigator
	expect(modalNavigator.getSnapshot().modal).toBe(true)
	expect(router.getSnapshot().modal).toBe(false)
	expect(container.querySelectorAll('#item')).toHaveLength(1)
	expect(document.querySelector('[role="dialog"] #item')).not.toBeNull()
	await modalNavigator.push({ to: '/settings' })
	expect(platform.views.getSnapshot().modals).toHaveLength(1)
	expect(document.querySelector('[role="dialog"] #settings')).not.toBeNull()
	expect((await modalNavigator.dismiss()).status).toBe('committed')
	expect(platform.views.getSnapshot().modals).toHaveLength(0)
	expect(location.pathname).toBe('/items/coat')
	expect(visibleText(container)).toBe('coat:coat3:0')
})

it('renders runtime replacement definitions from the instance registry', async () => {
	const { router, mount } = fixture()
	const container = mount()
	router.addRoutes(
		defineRoutes([
			defineRoute({ path: '/items/:id', loader: () => ({ title: 'replacement' }) }).screen(Item),
		]),
		{ id: 'plugin', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	expect(visibleText(container)).toBe('coat:replacement:0')
})

function Broken() {
	throw new Error('deliberate render failure')
}

it('settles render failures instead of hanging on a missing render receipt', async () => {
	const { router, mount } = fixture()
	mount()
	router.addRoutes(defineRoutes([defineRoute({ path: '/settings' }).screen(Broken)]), {
		id: 'broken',
		conflict: 'replace',
	})

	expect(await router.push({ to: '/settings' })).toMatchObject({
		status: 'failed',
		phase: 'commit',
	})
})

it('cancels preparation when its mounted owner leaves', async () => {
	const { router, mount } = fixture()
	let finish!: () => void
	const waiting = new Promise<void>((resolve) => {
		finish = resolve
	})

	router.addRoutes(
		defineRoutes([defineRoute({ path: '/settings', loader: () => waiting }).screen(Settings)]),
		{ id: 'waiting', conflict: 'replace' },
	)

	mount()
	const pending = router.push({ to: '/settings' })
	await Promise.resolve()
	cleanups.pop()!()
	expect(await pending).toEqual({ status: 'cancelled', reason: 'aborted' })
	finish()
})

function NamedApp(props: { platform: ReturnType<typeof createBrowserRouterHost> }) {
	return (
		<ClientRouteOutlet host={props.platform}>
			<ClientRouteOutlet host={props.platform} flow="left">
				<p>Left base</p>
			</ClientRouteOutlet>
			<ClientRouteOutlet host={props.platform} flow="right">
				<p>Right base</p>
			</ClientRouteOutlet>
		</ClientRouteOutlet>
	)
}

it('keeps accepted root navigation committed while hiding retained named outlets', async () => {
	const { router, mount } = fixture()
	const container = mount(NamedApp)
	const left = bindRouterFlow(router, 'left')
	const right = bindRouterFlow(router, 'right')
	await left.push({ to: '/items/:id', params: { id: 'coat' } })
	await right.push({ to: '/items/:id', params: { id: 'hat' } })
	expect(left.getSnapshot().canGoBack).toBe(false)
	expect((await right.back()).status).toBe('committed')
	expect(visibleText(container)).toContain('coat:coat3:0')
	expect((await router.push({ to: '/settings' })).status).toBe('committed')
	expect(visibleText(container)).toBe('Settings')
	await router.back()
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/settings',
				beforeLoad: () => {
					throw new DestinationRedirect({ to: '/items/:id', params: { id: 'cap' }, stack: 'root' })
				},
			}).screen(Settings),
		]),
		{ id: 'redirect', conflict: 'replace' },
	)

	expect((await left.push({ to: '/settings' })).status).toBe('committed')
	expect(visibleText(container)).toBe('cap:cap5:0')
})

it('awaits a composition barrier before changing browser history or DOM', async () => {
	const { platform, router, mount } = fixture()
	const container = mount()
	let release!: () => void
	let waiting = false
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	const original = platform.host.commit.bind(platform.host)
	platform.host.commit = (command) =>
		original({
			...command,
			beforeMutation: () => {
				waiting = true
				return barrier
			},
		})

	const pending = router.push({ to: '/settings' })
	try {
		await settle()
		expect(waiting).toBe(true)
		expect(location.pathname).toBe('/')
		expect(container.querySelector('#base')).not.toBeNull()
		release()
		expect((await pending).status).toBe('committed')
		expect(location.pathname).toBe('/settings')
	} finally {
		release()
		await pending
	}
})

it('does not mutate browser history after disposal during a composition barrier', async () => {
	const { platform, router, mount } = fixture()
	const container = mount()
	let release!: () => void
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	const original = platform.host.commit.bind(platform.host)
	platform.host.commit = (command) => original({ ...command, beforeMutation: () => barrier })
	const pending = router.push({ to: '/settings' })
	await settle()
	router.dispose()
	release()
	expect(await pending).toMatchObject({ status: 'cancelled', reason: 'disposed' })
	await settle()
	expect(location.pathname).toBe('/')
	expect(container.querySelector('#settings')).toBeNull()
})

it('does not commit into a different outlet lifetime after a barrier completes', async () => {
	const { platform, router, mount } = fixture()
	mount()
	let release!: () => void
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	const original = platform.host.commit.bind(platform.host)
	platform.host.commit = (command) => original({ ...command, beforeMutation: () => barrier })
	const pending = router.push({ to: '/settings' })
	try {
		await settle()
		const unmount = cleanups.pop()!
		unmount()
		expect(platform.views.getSnapshot().staged).toBeUndefined()
		const next = mount()
		expect(next.querySelector('#settings')).toBeNull()
		release()
		expect(await pending).toMatchObject({ status: 'cancelled', reason: 'disposed' })
		expect(location.pathname).toBe('/')
		expect(next.querySelector('#settings')).toBeNull()
		expect(next.querySelector('#base')).not.toBeNull()
	} finally {
		release()
		await pending
	}
})

it('serializes accepted browser commits around an asynchronous composition barrier', async () => {
	const { platform, router, mount } = fixture()
	const container = mount()
	let release!: () => void
	let waiting = false
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	const original = platform.host.commit.bind(platform.host)
	let calls = 0
	platform.host.commit = (command) =>
		original({
			...command,
			beforeMutation: () => (++calls === 1 ? ((waiting = true), barrier) : undefined),
		})

	const first = router.push({ to: '/items/:id', params: { id: 'coat' } })
	try {
		await settle()
		expect(waiting).toBe(true)
		const second = router.push({ to: '/settings' })
		await settle()
		expect(location.pathname).toBe('/')
		expect(calls).toBe(1)
		release()
		expect((await first).status).toBe('committed')
		expect((await second).status).toBe('committed')
		expect(location.pathname).toBe('/settings')
		expect(container.querySelector('#settings')).not.toBeNull()
	} finally {
		release()
		await first
	}
})

it('preserves current DOM, state, URL and history when page candidates fail rendering', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	const button = container.querySelector('#item') as HTMLButtonElement
	act(() => button.click())
	const before = { url: location.href, state: history.state, length: history.length }
	const layer = router.addRoutes(
		defineRoutes([defineRoute({ path: '/items/:id' }).screen(Broken)]),
		{ id: 'broken', conflict: 'replace' },
	)

	try {
		for (const action of ['push', 'replace'] as const) {
			expect(await router[action]({ to: '/items/:id', params: { id: 'broken' } })).toMatchObject({
				status: 'failed',
				phase: 'commit',
			})

			expect(container.querySelector('#item')).toBe(button)
			expect(button.textContent).toBe('coat:coat1:1')
			expect(location.href).toBe(before.url)
			expect(history.state).toEqual(before.state)
			expect(history.length).toBe(before.length)
			expect(platform.views.getSnapshot().staged).toBeUndefined()
			expect(router.getSnapshot().route?.params).toEqual({ id: 'coat' })
		}
	} finally {
		layer.dispose()
	}

	expect((await router.push({ to: '/settings' })).status).toBe('committed')
})

it('keeps a modal and presenter intact when its next screen fails rendering', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/settings', presentation: 'modal' })
	const modal = observedNavigator
	const settings = document.querySelector('[role="dialog"] #settings')
	expect(settings).not.toBeNull()
	const before = location.href
	const layer = router.addRoutes(
		defineRoutes([defineRoute({ path: '/items/:id' }).screen(Broken)]),
		{ id: 'broken', conflict: 'replace' },
	)

	try {
		expect(await modal.push({ to: '/items/:id', params: { id: 'bad' } })).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(document.querySelector('[role="dialog"] #settings')).toBe(settings)
		expect(platform.views.getSnapshot().modals).toHaveLength(1)
		expect(location.href).toBe(before)
	} finally {
		layer.dispose()
	}

	expect((await modal.dismiss()).status).toBe('committed')
	expect(location.pathname).toBe('/items/coat')
})

it('does not create a modal history entry when its candidate fails', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	const base = container.querySelector('#base')
	const before = { href: location.href, state: history.state, length: history.length }
	const layer = router.addRoutes(
		defineRoutes([defineRoute({ path: '/settings' }).screen(Broken)]),
		{ id: 'broken', conflict: 'replace' },
	)

	try {
		expect(await router.push({ to: '/settings', presentation: 'modal' })).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(container.querySelector('#base')).toBe(base)
		expect(platform.views.getSnapshot().modals).toHaveLength(0)
		expect(location.href).toBe(before.href)
		expect(history.state).toEqual(before.state)
		expect(history.length).toBe(before.length)
	} finally {
		layer.dispose()
	}
})

it('does not advance internal depth when the browser rejects a history write', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	await router.push({ to: '/settings' })
	await router.back()
	const base = container.querySelector('#base')
	const write = vi.spyOn(history, 'pushState').mockImplementation(() => {
		throw new DOMException('write rejected', 'SecurityError')
	})

	try {
		expect(await router.push({ to: '/items/:id', params: { id: 'coat' } })).toMatchObject({
			status: 'failed',
			phase: 'commit',
		})

		expect(router.getSnapshot().canGoBack).toBe(false)
		expect(location.pathname).toBe('/')
		expect(container.querySelector('#base')).toBe(base)
		expect(platform.views.getSnapshot().staged).toBeUndefined()
	} finally {
		write.mockRestore()
	}

	expect((await router.push({ to: '/settings' })).status).toBe('committed')
	expect((await router.back()).status).toBe('committed')
	expect(location.pathname).toBe('/')
})

it('reveals a staged screen without remounting its DOM or local state', async () => {
	const { platform, router, mount } = fixture()
	const container = mount()
	let release!: () => void
	const barrier = new Promise<void>((resolve) => {
		release = resolve
	})

	const original = platform.host.commit.bind(platform.host)
	platform.host.commit = (command) => original({ ...command, beforeMutation: () => barrier })
	const pending = router.push({ to: '/items/:id', params: { id: 'coat' } })
	try {
		await settle()
		const button = container.querySelector('#item') as HTMLButtonElement
		expect(button).not.toBeNull()
		expect(button.parentElement?.style.display).toBe('none')
		act(() => button.click())
		expect(button.textContent).toBe('coat:coat1:1')
		release()
		expect((await pending).status).toBe('committed')
		expect(container.querySelector('#item')).toBe(button)
		expect(button.textContent).toBe('coat:coat1:1')
		expect(button.parentElement?.style.display).toBe('contents')
	} finally {
		release()
		await pending
	}
})

it('retires an abandoned modal scope before its navigator can escape to root', async () => {
	const { platform, router, mount } = fixture()
	const container = mount()
	const original = platform.host.commit.bind(platform.host)
	platform.host.commit = (command) =>
		original({
			...command,
			beforeMutation: () => {
				throw new Error('presentation rejected')
			},
		})

	expect(
		await router.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal' }),
	).toMatchObject({ status: 'failed', phase: 'commit' })

	const abandoned = observedNavigator
	expect(await abandoned.push({ to: '/settings', stack: 'root' })).toEqual({
		status: 'cancelled',
		reason: 'disposed',
	})

	expect(platform.views.getSnapshot().staged).toBeUndefined()
	expect(platform.views.getSnapshot().modals).toHaveLength(0)
	expect(container.querySelector('#base')).not.toBeNull()
	expect(location.pathname).toBe('/')
})

function deferredTransitions() {
	const descriptor = Object.getOwnPropertyDescriptor(document, 'startViewTransition')
	const updates: (() => Promise<void>)[] = []
	const finishes: (() => void)[] = []
	const skipped: boolean[] = []
	Object.defineProperty(document, 'startViewTransition', {
		configurable: true,
		value: (update: () => Promise<void>) => {
			const index = updates.length
			let complete!: () => void
			let done!: () => void
			const updated = new Promise<void>((resolve) => {
				done = resolve
			})

			const finished = new Promise<void>((resolve) => {
				complete = resolve
			})

			updates.push(async () => {
				await update()
				done()
				if (skipped[index]) {
					complete()
				}
			})

			finishes.push(complete)
			skipped.push(false)
			return {
				ready: updated,
				updateCallbackDone: updated,
				finished,
				types: new Set(),
				skipTransition() {
					skipped[index] = true
					void updated.then(complete)
				},
			}
		},
	})

	cleanups.push(() => {
		if (descriptor) {
			Object.defineProperty(document, 'startViewTransition', descriptor)
		} else {
			Reflect.deleteProperty(document, 'startViewTransition')
		}
	})

	return { updates, finishes }
}

it('flushes visible DOM and URL inside the transition callback and returns before animation finishes', async () => {
	const { router, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	const { updates, finishes } = deferredTransitions()
	const pending = router.push({ to: '/settings', transition: 'fade' })
	await vi.waitFor(() => expect(updates).toHaveLength(1))
	expect(visibleText(container)).toBe('coat:coat1:0')
	expect(location.pathname).toBe('/items/coat')
	await updates[0]()
	expect(visibleText(container)).toBe('Settings')
	expect(location.pathname).toBe('/settings')
	const result = await pending
	expect(result.status).toBe('committed')
	if (result.status !== 'committed') {
		throw new Error('Expected commit')
	}

	let animated = false
	void result.finished.then(() => {
		animated = true
	})

	await Promise.resolve()
	expect(animated).toBe(false)
	finishes[0]()
	expect(await result.finished).toEqual({ status: 'completed' })
})

it('prevents a skipped deferred callback from replacing a newer committed route', async () => {
	const { router, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	const { updates } = deferredTransitions()
	const older = router.push({ to: '/settings', transition: 'fade' })
	await vi.waitFor(() => expect(updates).toHaveLength(1))
	const newer = router.push({ to: '/items/:id', params: { id: 'hat' }, transition: 'none' })
	expect(await older).toEqual({ status: 'cancelled', reason: 'superseded' })
	expect((await newer).status).toBe('committed')
	await updates[0]()
	expect(visibleText(container)).toBe('hat:hat2:0')
	expect(location.pathname).toBe('/items/hat')
	expect(router.getSnapshot().route?.to).toBe('/items/:id')
})

it('settles disposal before a deferred browser update and prevents its later mutation', async () => {
	const { router, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	const { updates } = deferredTransitions()
	const pending = router.push({ to: '/settings', transition: 'fade' })
	await vi.waitFor(() => expect(updates).toHaveLength(1))
	router.dispose()
	expect(await pending).toEqual({ status: 'cancelled', reason: 'disposed' })
	await updates[0]()
	expect(container.querySelector('#settings')).toBeNull()
	expect(location.pathname).toBe('/items/coat')
})

it('releases committed and saved data when the root outlet owner ends', async () => {
	let account = 'a'
	const { platform, router, mount } = fixture((id, load) => account + ':' + id + ':' + load)
	const original = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/items/:id', params: { id: 'hat' } })
	expect(original.querySelector('#item')?.textContent).toContain(':a:hat:')
	const unmount = cleanups.pop()!
	unmount()
	expect(router.getSnapshot().route).toBeNull()
	expect(router.getSnapshot().canGoBack).toBe(false)
	expect(platform.views.getSnapshot()).toMatchObject({ main: null, modals: [] })
	account = 'b'
	const next = mount()
	expect(visibleText(next)).toBe('Base')
	await router.navigateUrl('/items/hat', { replace: true })
	expect(next.querySelector('#item')?.textContent).toContain(':b:hat:')
	await act(async () => {
		history.back()
		await new Promise((resolve) => setTimeout(resolve, 50))
	})

	expect(visibleText(next)).not.toContain(':a:')
})

it('rechecks guards before restoring a previously admitted browser entry', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	let guards = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					guards++
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'guarded-history', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	const sourceUrl = location.href
	allowed = false
	expect(await router.back()).toEqual({ status: 'forbidden' })
	expect(guards).toBe(2)
	expect(location.href).toBe(sourceUrl)
	expect(visibleText(container)).toBe('Settings')
	expect(router.getSnapshot().navigation).toMatchObject({
		status: 'failed',
		result: { status: 'forbidden' },
	})
})

it('corrects denied browser Back and admits the same entry after authorization changes', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	let loads = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id + ++loads }),
			}).screen(Item),
		]),
		{ id: 'guarded-history', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	allowed = false
	history.back()
	await vi.waitFor(() =>
		expect(router.getSnapshot().navigation).toMatchObject({
			status: 'failed',
			result: { status: 'forbidden' },
		}),
	)

	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(loads).toBe(1)
	allowed = true
	history.back()
	await vi.waitFor(() => expect(visibleText(container)).toBe('coat:coat2:0'))
	expect(location.pathname).toBe('/items/coat')
	expect(router.getSnapshot().navigation.status).toBe('idle')
})

it('corrects denied browser Forward and reruns its loader only after admission', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	let loads = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id + ++loads }),
			}).screen(Item),
		]),
		{ id: 'guarded-forward', conflict: 'replace' },
	)

	await router.push({ to: '/settings', transition: 'none' })
	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.back()
	allowed = false
	history.forward()
	await vi.waitFor(() => expect(router.getSnapshot().navigation.status).toBe('failed'))
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(loads).toBe(1)
	allowed = true
	history.forward()
	await vi.waitFor(() => expect(visibleText(container)).toBe('coat:coat2:0'))
})

it('redirects an imperative Back into the traversed entry without adding history', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let redirect = false
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (redirect) {
						throw new DestinationRedirect({ to: '/settings' })
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'redirect-back', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/items/:id', params: { id: 'hat' }, transition: 'none' })
	const length = history.length
	redirect = true
	const result = await router.back()
	expect(result.status).toBe('committed')
	if (result.status === 'committed') {
		expect(result.redirected).toBe(true)
	}

	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(history.length).toBe(length)
})

it('keeps the current URL and DOM when an imperative history destination fails to render', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let broken = false
	function HistoryScreen(props: { params: { id: string }; data: { title: string } }) {
		if (broken) {
			throw new Error('history render failure')
		}

		return <Item {...props} />
	}

	router.addRoutes(
		defineRoutes([
			defineRoute({ path: '/items/:id', loader: ({ params }) => ({ title: params.id }) }).screen(
				HistoryScreen,
			),
		]),
		{ id: 'history-render', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	broken = true
	expect(await router.back()).toMatchObject({ status: 'failed', phase: 'commit' })
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
})

it('corrects browser history when a restored destination fails to render', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let broken = false
	function HistoryScreen(props: { params: { id: string }; data: { title: string } }) {
		if (broken) {
			throw new Error('history render failure')
		}

		return <Item {...props} />
	}

	router.addRoutes(
		defineRoutes([
			defineRoute({ path: '/items/:id', loader: ({ params }) => ({ title: params.id }) }).screen(
				HistoryScreen,
			),
		]),
		{ id: 'history-render', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	broken = true
	history.back()
	await vi.waitFor(() =>
		expect(router.getSnapshot().navigation).toMatchObject({
			status: 'failed',
			result: { status: 'failed', phase: 'commit' },
		}),
	)

	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
})

it('cancels a pending history guard when a newer navigation commits', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let waitForGuard = false
	let started!: () => void
	let finish!: () => void
	const entered = new Promise<void>((resolve) => {
		started = resolve
	})

	const gate = new Promise<void>((resolve) => {
		finish = resolve
	})

	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				async beforeLoad() {
					if (waitForGuard) {
						started()
						await gate
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-cancel', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	waitForGuard = true
	const older = router.back()
	await entered
	expect((await router.replace({ to: '/settings', transition: 'none' })).status).toBe('committed')
	expect(await older).toEqual({ status: 'cancelled', reason: 'superseded' })
	finish()
	await settle()
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
})

it('corrects a superseded external traversal before committing the newer request', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let waiting = false
	let started!: () => void
	let finish!: () => void
	const entered = new Promise<void>((resolve) => {
		started = resolve
	})

	const gate = new Promise<void>((resolve) => {
		finish = resolve
	})

	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				async beforeLoad() {
					if (waiting) {
						started()
						await gate
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-external-cancel', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	waiting = true
	history.back()
	await entered
	expect((await router.replace({ to: '/settings', transition: 'none' })).status).toBe('committed')
	finish()
	await settle()
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	waiting = false
	expect((await router.back()).status).toBe('committed')
	expect(location.pathname).toBe('/items/coat')
})

it('reprepares old URLs after root-owner replacement and corrects denied access', async () => {
	const { router, mount } = fixture()
	let allowed = true
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-owner', conflict: 'replace' },
	)

	mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	cleanups.pop()!()
	const container = mount()
	await router.navigateUrl('/settings', { replace: true })
	allowed = false
	history.back()
	await vi.waitFor(() =>
		expect(router.getSnapshot().navigation).toMatchObject({
			status: 'failed',
			result: { status: 'forbidden' },
		}),
	)

	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(router.getSnapshot().canGoBack).toBe(false)
	allowed = true
	history.back()
	await vi.waitFor(() => expect(visibleText(container)).toBe('coat:coat:0'))
})

it('retries a denied browser Forward in the original direction', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-forward-retry', conflict: 'replace' },
	)

	await router.push({ to: '/settings', transition: 'none' })
	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.back()
	allowed = false
	history.forward()
	await vi.waitFor(() =>
		expect(router.getSnapshot().navigation).toMatchObject({ status: 'failed', action: 'forward' }),
	)

	const length = history.length
	allowed = true
	expect((await router.retry()).status).toBe('committed')
	expect(location.pathname).toBe('/items/coat')
	expect(visibleText(container)).toBe('coat:coat:0')
	expect(history.length).toBe(length)
	expect((await router.back()).status).toBe('committed')
	expect(location.pathname).toBe('/settings')
})

it('rebases denied foreign history to the admitted URL without trusting its state', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	let loads = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id + ++loads }),
			}).screen(Item),
		]),
		{ id: 'history-foreign', conflict: 'replace' },
	)

	await router.push({ to: '/settings', transition: 'none' })
	history.pushState(null, '', '/items/foreign')
	history.back()
	await vi.waitFor(() => expect(location.pathname).toBe('/settings'))
	await settle()
	allowed = false
	const length = history.length
	history.forward()
	await vi.waitFor(() =>
		expect(router.getSnapshot().navigation).toMatchObject({
			status: 'failed',
			result: { status: 'forbidden' },
		}),
	)

	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(loads).toBe(0)
	expect(router.getSnapshot().canGoBack).toBe(false)
	expect(history.length).toBe(length)
})

it('lets a second browser traversal supersede an earlier pending history guard', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let waiting = false
	let started!: () => void
	let finish!: () => void
	const entered = new Promise<void>((resolve) => {
		started = resolve
	})

	const gate = new Promise<void>((resolve) => {
		finish = resolve
	})

	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				async beforeLoad({ params }) {
					if (waiting && params.id === 'hat') {
						started()
						await gate
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-external-overlap', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/items/:id', params: { id: 'hat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	waiting = true
	history.back()
	await entered
	history.back()
	await vi.waitFor(() => expect(visibleText(container)).toBe('coat:coat:0'))
	finish()
	await settle()
	expect(location.pathname).toBe('/items/coat')
	expect(router.getSnapshot().navigation.status).toBe('idle')
})

it('refuses history whose named outlet has ended instead of waiting for an impossible render', async () => {
	const { platform, router, mount } = fixture()
	let remove!: () => void
	function OptionalNamedApp() {
		const [shown, setShown] = useState(true)
		remove = () => setShown(false)
		return (
			<ClientRouteOutlet host={platform}>
				{shown ? (
					<ClientRouteOutlet host={platform} flow="left">
						<p>Left base</p>
					</ClientRouteOutlet>
				) : null}
			</ClientRouteOutlet>
		)
	}

	const container = mount(OptionalNamedApp)
	await router
		.forStack('left')
		.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })

	await router.push({ to: '/settings', transition: 'none' })
	act(() => remove())
	expect(await router.back()).toEqual({ status: 'unsupported', operation: 'missing-outlet' })
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
})

it('rebases the admitted URL if the browser refuses a history correction', async () => {
	const { router, mount } = fixture()
	const container = mount()
	let allowed = true
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'history-correction-refused', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	allowed = false
	const go = vi.spyOn(history, 'go').mockImplementation(() => {
		throw new Error('Traversal refused')
	})

	try {
		history.back()
		await vi.waitFor(() =>
			expect(router.getSnapshot().navigation).toMatchObject({
				status: 'failed',
				result: { status: 'forbidden' },
			}),
		)

		expect(location.pathname).toBe('/settings')
		expect(visibleText(container)).toBe('Settings')
		expect(router.getSnapshot().canGoBack).toBe(false)
	} finally {
		go.mockRestore()
	}
})

it('presents a modal history redirect over the admitted source instead of restoring its denied target', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	let redirect = false
	let modalLoads = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (redirect) {
						throw new DestinationRedirect({ to: '/login', presentation: 'modal' })
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
			defineRoute({ path: '/login', loader: () => ++modalLoads }).screen(() => (
				<p id="login">Sign in</p>
			)),
		]),
		{ id: 'modal-history-redirect', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	redirect = true
	const result = await router.back()
	expect(result.status === 'committed' && result.redirected).toBe(true)
	expect(location.pathname).toBe('/login')
	expect(platform.views.getSnapshot().main?.route.to).toBe('/settings')
	expect(platform.views.getSnapshot().modals).toHaveLength(1)
	expect(container.querySelector('#item')).toBeNull()
	expect(document.querySelector('[role="dialog"] #login')?.textContent).toBe('Sign in')
	expect(modalLoads).toBe(1)
})

it('corrects external Back before presenting its prepared modal redirect', async () => {
	const { router, platform, mount } = fixture()
	mount()
	let redirect = false
	let loads = 0
	router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (redirect) {
						throw new DestinationRedirect({ to: '/login', presentation: 'modal' })
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
			defineRoute({ path: '/login', loader: () => ++loads }).screen(() => <p>Sign in</p>),
		]),
		{ id: 'external-modal-history-redirect', conflict: 'replace' },
	)

	await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
	await router.push({ to: '/settings', transition: 'none' })
	redirect = true
	history.back()
	await vi.waitFor(() => expect(platform.views.getSnapshot().modals).toHaveLength(1))
	expect(location.pathname).toBe('/login')
	expect(platform.views.getSnapshot().main?.route.to).toBe('/settings')
	expect(loads).toBe(1)
})

it('corrects external Back after a confirmation reset without loading or revealing its target', async () => {
	let loads = 0
	const { router, mount } = fixture((id) => {
		loads++
		return id
	})

	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/items/:id', params: { id: 'hat' } })
	act(() => (container.querySelector('#item') as HTMLButtonElement).click())
	const before = loads
	const blocker = createNavigationBlocker()
	cleanups.push(
		registerNavigationBlocker(router.forStack('root'), { blocker, shouldBlock: () => true }),
	)

	history.back()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	expect(visibleText(container)).toBe('hat:hat:1')
	expect(loads).toBe(before)
	const refused = blocker.getSnapshot()
	if (refused.status !== 'blocked') {
		throw new Error('Expected confirmation')
	}

	refused.reset()
	await vi.waitFor(() => {
		expect(location.pathname).toBe('/items/hat')
		expect(router.getSnapshot().navigation.status).toBe('idle')
	})

	expect(visibleText(container)).toBe('hat:hat:1')
	expect(loads).toBe(before)
	history.back()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const admitted = blocker.getSnapshot()
	if (admitted.status !== 'blocked') {
		throw new Error('Expected new confirmation')
	}

	admitted.proceed()
	// Browser route entries remount on restoration; source state must survive
	// a refusal, while the target still receives freshly prepared data.
	await vi.waitFor(() => expect(visibleText(container)).toBe('coat:coat:0'))
	expect(location.pathname).toBe('/items/coat')
	expect(loads).toBe(before + 1)
})

it('confirms browser Back to a declaring base even when there is no target route to prepare', async () => {
	const { router, mount } = fixture()
	const container = mount()
	await router.push({ to: '/settings' })
	const blocker = createNavigationBlocker()
	cleanups.push(
		registerNavigationBlocker(router.forStack('root'), { blocker, shouldBlock: () => true }),
	)

	history.back()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const refusal = blocker.getSnapshot()
	if (refusal.status !== 'blocked') {
		throw new Error('Expected confirmation')
	}

	refusal.reset()
	await vi.waitFor(() => expect(location.pathname).toBe('/settings'))
	expect(visibleText(container)).toBe('Settings')
	history.back()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const allowed = blocker.getSnapshot()
	if (allowed.status !== 'blocked') {
		throw new Error('Expected new confirmation')
	}

	allowed.proceed()
	await vi.waitFor(() => expect(visibleText(container)).toBe('Base'))
	expect(location.pathname).toBe('/')
	expect(router.getSnapshot().route).toBeNull()
})

it('supersedes a held external traversal without letting its old controls affect the replacement', async () => {
	let loads = 0
	const { router, mount } = fixture((id) => {
		loads++
		return id
	})

	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/items/:id', params: { id: 'hat' } })
	let when = true
	const blocker = createNavigationBlocker()
	cleanups.push(
		registerNavigationBlocker(router.forStack('root'), { blocker, shouldBlock: () => when }),
	)

	history.back()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const obsolete = blocker.getSnapshot()
	if (obsolete.status !== 'blocked') {
		throw new Error('Expected confirmation')
	}

	when = false
	expect((await router.push({ to: '/settings' })).status).toBe('committed')
	obsolete.proceed()
	obsolete.reset()
	await settle()
	expect(location.pathname).toBe('/settings')
	expect(visibleText(container)).toBe('Settings')
	expect(loads).toBe(2)
	expect(blocker.getSnapshot().status).toBe('idle')
})

it('corrects a held Forward refusal and can proceed in the original direction later', async () => {
	const { router, mount } = fixture((id) => id)
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/items/:id', params: { id: 'hat' } })
	await router.back()
	const blocker = createNavigationBlocker()
	cleanups.push(
		registerNavigationBlocker(router.forStack('root'), { blocker, shouldBlock: () => true }),
	)

	history.forward()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const refused = blocker.getSnapshot()
	if (refused.status !== 'blocked') {
		throw new Error('Expected confirmation')
	}

	expect(refused.action).toBe('forward')
	refused.reset()
	await vi.waitFor(() => expect(location.pathname).toBe('/items/coat'))
	expect(visibleText(container)).toBe('coat:coat:0')
	history.forward()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('blocked'))
	const admitted = blocker.getSnapshot()
	if (admitted.status !== 'blocked') {
		throw new Error('Expected new confirmation')
	}

	admitted.proceed()
	await vi.waitFor(() => expect(visibleText(container)).toBe('hat:hat:0'))
	expect(location.pathname).toBe('/items/hat')
})

it('keeps modal focus ownership across screens and restores a revalidated opener', async () => {
	const { router, mount } = fixture()
	router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({ path: '/settings', head: () => ({ title: 'Settings dialog' }) }).screen(
				Settings,
			),
		]),
		{ id: 'focus-title', conflict: 'replace' },
	)

	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	const opener = container.querySelector('#item') as HTMLButtonElement
	opener.focus()
	await router.push({ to: '/items/:id', params: { id: 'hat' }, presentation: 'modal' })
	const modal = observedNavigator
	const panel = document.querySelector('[role="dialog"]') as HTMLElement
	expect(panel.getAttribute('aria-modal')).toBe('true')
	try {
		act(() => setThemePreference('dark'))
		expect(panel.closest('.vx-modalroute')?.classList.contains('dark')).toBe(true)
		act(() => setThemePreference('light'))
		expect(panel.closest('.vx-modalroute')?.classList.contains('dark')).toBe(false)
	} finally {
		act(() => setThemePreference('system'))
	}

	expect(container.contains(panel)).toBe(false)
	expect(container.hasAttribute('inert')).toBe(true)
	expect(document.activeElement).toBe(panel.querySelector('#item'))
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
	)

	expect(document.activeElement).toBe(panel.querySelector('#item'))
	await modal.push({ to: '/settings' })
	expect(document.querySelector('[role="dialog"]')).toBe(panel)
	expect(panel.getAttribute('aria-label')).toBe('Settings dialog')
	expect(document.activeElement).toBe(panel)
	expect((await modal.dismiss()).status).toBe('committed')
	expect(container.hasAttribute('inert')).toBe(false)
	expect(document.querySelector('[role="dialog"]')).toBeNull()
	// Dismissal re-prepares the presenter; its new control keeps the stable ID.
	expect(document.activeElement).toBe(container.querySelector('#item'))
})

it('routes modal Escape through admission and retains focus after refusal', async () => {
	const { router, platform, mount } = fixture()
	let deny = false
	router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({
				path: '/items/:id',
				beforeLoad() {
					if (deny) {
						throw new RouteForbidden()
					}
				},
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
		]),
		{ id: 'focus-guard', conflict: 'replace' },
	)

	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })

	;(container.querySelector('#item') as HTMLElement).focus()
	await router.push({ to: '/settings', presentation: 'modal' })
	const panel = document.querySelector('[role="dialog"]') as HTMLElement
	deny = true
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
	)

	await settle()
	expect(platform.views.getSnapshot().modals).toHaveLength(1)
	expect(document.activeElement).toBe(panel)
	deny = false
	document.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
	)

	await vi.waitFor(() => expect(platform.views.getSnapshot().modals).toHaveLength(0))
	expect(document.activeElement).toBe(container.querySelector('#item'))
})

it('restores nested modal focus and leaves failed staging outside the active dialog', async () => {
	const { router, platform, mount } = fixture()
	const container = mount()
	await router.push({ to: '/items/:id', params: { id: 'coat' } })
	await router.push({ to: '/settings', presentation: 'modal' })
	const outer = observedNavigator
	const outerPanel = document.querySelector('[role="dialog"]') as HTMLElement
	await outer.push({ to: '/items/:id', params: { id: 'hat' }, presentation: 'modal' })
	const inner = observedNavigator
	expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2)
	expect(outerPanel.closest('[inert]')).not.toBeNull()
	expect(document.querySelectorAll('[role="dialog"]')[1].contains(document.activeElement)).toBe(
		true,
	)

	expect((await inner.dismiss()).status).toBe('committed')
	expect(document.activeElement).toBe(outerPanel)
	expect(container.hasAttribute('inert')).toBe(true)
	const layer = router.addRoutes(
		defineRoutes([defineRoute({ path: '/items/:id' }).screen(Broken)]),
		{ id: 'focus-broken', conflict: 'replace' },
	)

	try {
		expect(await outer.push({ to: '/items/:id', params: { id: 'bad' } })).toMatchObject({
			status: 'failed',
		})

		expect(document.activeElement).toBe(outerPanel)
		expect(platform.views.getSnapshot().modals).toHaveLength(1)
	} finally {
		layer.dispose()
	}

	expect((await outer.dismiss()).status).toBe('committed')
	expect(container.hasAttribute('inert')).toBe(false)
})

function FocusPage(props: { params: { id: string }; data: { title: string } }) {
	return (
		<main>
			<h1 id={'heading-' + props.params.id}>{props.data.title}</h1>
			<button id={'control-' + props.params.id}>Continue</button>
			<h2 id="part one">A section</h2>
		</main>
	)
}

it('focuses committed content, preserves refresh and restores entry focus through Back', async () => {
	const { router, mount } = fixture()
	router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({
				path: '/focus/:id',
				loader: ({ params }) => ({ title: params.id }),
				head: ({ params: { id } }) => ({ title: 'Focus ' + id }),
			}).screen(FocusPage),
		]),
		{ id: 'page-focus' },
	)

	mount()
	await router.push({ to: '/focus/:id', params: { id: 'first' } })
	const heading = document.getElementById('heading-first')!
	expect(document.activeElement).toBe(heading)
	expect(heading.getAttribute('tabindex')).toBe('-1')
	const control = document.getElementById('control-first')!
	control.focus()
	expect(heading.hasAttribute('tabindex')).toBe(false)
	await router.refresh()
	expect(document.activeElement).toBe(control)
	await router.push({ to: '/focus/:id', params: { id: 'second' } })
	expect(document.activeElement).toBe(document.getElementById('heading-second'))
	expect((await router.back()).status).toBe('committed')
	expect(document.activeElement).toBe(document.getElementById('control-first'))
	expect(document.title).toBe('Focus first')
})

it('focuses a decoded fragment and prevents cancelled loaders from changing focus or metadata', async () => {
	const { router, mount } = fixture()
	let finish!: () => void
	const wait = new Promise<void>((resolve) => {
		finish = resolve
	})

	router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({
				path: '/focus/:id',
				loader: async ({ params }) => {
					if (params.id === 'slow') {
						await wait
					}

					return { title: params.id }
				},
				head: ({ params: { id } }) => ({ title: 'Focus ' + id }),
			}).screen(FocusPage),
		]),
		{ id: 'page-focus' },
	)

	mount()
	await router.push({ to: '/focus/:id', params: { id: 'first' }, hash: 'part one' })
	expect(document.activeElement).toBe(document.getElementById('part one'))
	const pending = router.push({ to: '/focus/:id', params: { id: 'slow' } })
	await router.push({ to: '/focus/:id', params: { id: 'latest' } })
	const heading = document.getElementById('heading-latest')!
	finish()
	expect((await pending).status).toBe('cancelled')
	await settle()
	expect(document.activeElement).toBe(heading)
	expect(document.title).toBe('Focus latest')
	cleanups.pop()!()
	expect(heading.hasAttribute('tabindex')).toBe(false)
})

it('returns modal focus to a revalidated noninteractive fragment heading', async () => {
	const { router, mount } = fixture()
	router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({ path: '/focus/:id', loader: ({ params }) => ({ title: params.id }) }).screen(
				FocusPage,
			),
		]),
		{ id: 'fragment-return' },
	)

	mount()
	await router.push({ to: '/focus/:id', params: { id: 'first' }, hash: 'part one' })
	expect(document.activeElement).toBe(document.getElementById('part one'))
	await router.push({ to: '/settings', presentation: 'modal' })
	const modal = observedNavigator
	expect((await modal.dismiss()).status).toBe('committed')
	expect(document.activeElement).toBe(document.getElementById('part one'))
	expect(document.activeElement?.getAttribute('tabindex')).toBe('-1')
})

/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { qualifyNativeAuthentication } from '../tests/authentication-native-example.tsrx'
import { createPortalObjectDriver } from '../tests/portal-object-driver'
import { createContext, useContext, useState, useLayoutEffect } from 'octane'
import {
	createObjectContainer,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

const native = vi.hoisted(() => {
	const surfaces: any[] = []
	const animations: Animation[] = []
	class Animation {
		isPlaying = false
		complete!: () => void
		fail!: (error: unknown) => void
		constructor(_definitions: unknown[]) {
			animations.push(this)
		}
		play() {
			this.isPlaying = true
			return new Promise<void>((resolve, reject) => {
				this.complete = () => {
					this.isPlaying = false
					resolve()
				}

				this.fail = reject
			})
		}
		cancel() {
			this.isPlaying = false
			this.fail(new Error('SDK cancelled'))
		}
	}

	const activity = {}
	const backEvents = new Map<string, (event: any) => void>()
	const Application: any = {
		android: { on: (name: string, callback: any) => backEvents.set(name, callback) },
		AndroidApplication: { activityBackPressedEvent: 'back' },
	}

	class Events {
		listeners = new Map<string, Set<(event: any) => void>>()
		on(name: string, listener: (event: any) => void) {
			const values = this.listeners.get(name) ?? new Set()
			values.add(listener)
			this.listeners.set(name, values)
		}
		off(name: string, listener: (event: any) => void) {
			this.listeners.get(name)?.delete(listener)
		}
		emit(name: string, event: any = {}) {
			for (const listener of [...(this.listeners.get(name) ?? [])]) {
				listener(event)
			}
		}
	}

	class GridLayout extends Events {
		nativeViewProtected = {}
		opacity = 1
		translateX = 0
		translateY = 0
		scaleX = 1
		scaleY = 1
		rotate = 0
		isLoaded = false
		showStarted = false
		closeRequested = false
		parentModal: any
		options: any
		showModal(view: GridLayout, options: any) {
			view.parentModal = this
			view.options = options
			view.showStarted = true
			surfaces.push(view)
		}
		closeModal() {
			this.closeRequested = true
		}
		completeShow() {
			this.isLoaded = true
			this.emit('shownModally')
		}
		completeClose() {
			this.isLoaded = false
			this.emit('closedModally')
		}
	}

	class Page extends GridLayout {
		isLoaded = true
		frame: any
		content: any
		ios = {}
	}

	class Frame extends Events {
		android = { activity }
		isLoaded = true
		currentPage = new Page()
		backStack: any[] = []
		currentEntry: any = {}
		constructor() {
			super()
			this.currentPage.frame = this
		}
		canGoBack() {
			return this.backStack.length > 0
		}
		callLoaded() {
			this.isLoaded = true
		}
		navigate(args: any) {
			const page = args.create()
			this.emit('navigatingTo', { entry: { resolvedPage: page } })
			if (args.clearHistory) {
				this.backStack = []
			} else {
				this.backStack.push({ resolvedPage: this.currentPage })
			}

			this.currentPage = page
			page.frame = this
			this.currentEntry = args
			this.emit('navigatedTo')
		}
		replacePage(args: any) {
			const page = args.create()
			this.emit('navigatingTo', { entry: { resolvedPage: page } })
			this.currentPage = page
			page.frame = this
			this.currentEntry = args
			this.emit('navigatedTo')
		}
		goBack(entry: any) {
			this.currentPage = entry.resolvedPage
			this.backStack.splice(this.backStack.indexOf(entry))
			this.emit('navigatedTo')
		}
	}

	return {
		Frame,
		Page,
		GridLayout,
		View: GridLayout,
		Animation,
		animations,
		surfaces,
		Application,
		activity,
		backEvents,
	}
})

const theme = vi.hoisted(() => ({ unbound: vi.fn() }))
vi.mock('@nativescript/core', () => ({ ...native, isIOS: false }))
vi.mock('./theme/theme-host', () => ({ applyThemeClasses: () => theme.unbound }))
function TestView(props: any) {
	return (
		<stacklayout ref={props.ref} style={props.style}>
			{props.children}
		</stacklayout>
	)
}

vi.mock('./View', () => ({
	get View() {
		return TestView
	},
}))

function TestText(props: any) {
	return <label text={props.children} />
}

vi.mock('./Text', () => ({
	get Text() {
		return TestText
	},
}))

import { createNativeModalRouterHost } from './native-modal-router-host'
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { bindRouterFlow, createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { defineTransitions } from './route-transitions'
import { defineNativeTransition } from './native-route-transition'
import { RouteForbidden, DestinationRedirect } from './routing-core'
import { getRouteApi, useRouter } from './router-hooks.tsrx'
import type { RouterInstance, RouterNavigator, TransitionRegistry } from './props'

const Person = createContext('missing')
const PersonProvider: any = Person
let navigation: RouterInstance<any>
const observations = new Map<
	string,
	{
		count: number
		person: string
		title: string
		navigation: RouterNavigator<any>
		increment(): void
	}
>()

let removeOwner = () => {}
let restoreOwner = () => {}
let remountOwner = () => {}
let remountNavigation: Promise<{ status: string }> | undefined
let changePerson = (_person: string) => {}
function Item() {
	const item = getRouteApi('/items/:id', navigation)
	const id = item.useParams().id
	const title = item.useLoaderData().title
	const person = useContext(Person)
	const [count, setCount] = useState(0)
	observations.set(id, {
		count,
		person,
		title,
		navigation: useRouter(navigation),
		increment: () => setCount((value) => value + 1),
	})

	return <label text={title + ':' + count + ':' + person} />
}

function Broken() {
	throw new Error('modal render failed')
}

function RemountedEntry(props: { version: number }) {
	const owner = useRouter(navigation)
	useLayoutEffect(() => {
		if (props.version > 0) {
			remountNavigation = owner.replace({
				to: '/items/:id',
				params: { id: 'remounted' },
				transition: 'none',
			})
		}
	}, [])

	return null
}

function App(props: { platform: ReturnType<typeof createNativeModalRouterHost> }) {
	const [owned, setOwned] = useState(true)
	const [version, setVersion] = useState(0)
	remountOwner = () => setVersion((value) => value + 1)
	const [person, setPerson] = useState('Avery')
	removeOwner = () => setOwned(false)
	restoreOwner = () => setOwned(true)
	changePerson = setPerson
	return (
		<PersonProvider value={person}>
			{owned ? (
				<>
					<ClientRouteOutlet key={version} host={props.platform}>
						<RemountedEntry version={version} />
						<label text="base" />
					</ClientRouteOutlet>
					<ClientRouteOutlet host={props.platform} flow="other">
						<label text="other-base" />
					</ClientRouteOutlet>
				</>
			) : (
				<label text="outside" />
			)}
		</PersonProvider>
	)
}

async function tick() {
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

async function drive<T>(promise: Promise<T>): Promise<T> {
	let settled = false
	void promise.then(
		() => {
			settled = true
		},
		() => {
			settled = true
		},
	)

	await until(() => settled)
	return promise
}

async function fixture<const Effects extends TransitionRegistry = {}>(
	timeout = 1000,
	effects?: Effects,
	behavior?: {
		guard?(id: string): void | Promise<void>
		account?(): string
		title?(id: string, account: string): string
	},
) {
	native.surfaces.length = 0
	native.animations.length = 0
	theme.unbound.mockClear()
	observations.clear()
	const frame = new native.Frame()
	const errors: unknown[] = []
	const platform = createNativeModalRouterHost({
		getFrame: (flow) => (flow === 'root' ? (frame as any) : undefined),
		modalTimeoutMs: timeout,
		onCleanupError: (error) => errors.push(error),
	})

	const router = createRouter({
		catalog: defineRoutes([
			defineRoute
				.withContext<{ account: string }>()({
					path: '/items/:id',
					beforeLoad: ({ params }) => behavior?.guard?.(params.id),
					loader: ({ params, context }) => ({
						title: behavior?.title?.(params.id, context.account) ?? params.id.toUpperCase(),
					}),
				})
				.screen(Item),
		]),
		host: platform.host,
		transitions: effects,
		stacks: ['other'],
		context: () => ({ account: behavior?.account?.() ?? 'default' }),
	})

	navigation = router
	platform.attach(router)
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createPortalObjectDriver(),
	)

	root.render(App, { platform })
	await tick()
	return {
		frame,
		router,
		platform,
		errors,
		root,
		async open(id: string, from: RouterNavigator<any> = router) {
			const before = native.surfaces.length
			const pending = from.push({
				to: '/items/:id',
				params: { id },
				presentation: 'modal',
				transition: 'none',
			})

			await until(() => native.surfaces.length > before)
			const view = native.surfaces.at(-1)
			view.completeShow()
			const result = await drive(pending)
			expect(result.status).toBe('committed')
			return view
		},
		async close() {
			root.unmount()
			router.dispose()
			for (let i = 0; i < 10; i++) {
				await tick()
				for (const view of native.surfaces) {
					if (!view.isLoaded) {
						view.completeShow()
					}

					if (view.closeRequested) {
						view.completeClose()
					}
				}
			}
		},
	}
}

it('waits for native shown confirmation after rendering, without a nested Frame', async () => {
	const test = await fixture()
	try {
		let settled = false
		const pending = test.router
			.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal', transition: 'none' })
			.then((result) => {
				settled = true
				return result
			})

		await until(() => native.surfaces.length === 1)
		expect(observations.get('coat')).toMatchObject({ title: 'COAT', person: 'Avery' })
		expect(settled).toBe(false)
		expect(test.frame.backStack).toHaveLength(0)
		expect(native.surfaces[0].options).toMatchObject({ fullscreen: true, cancelable: false })
		native.surfaces[0].completeShow()
		const result = await drive(pending)
		expect(result.status).toBe('committed')
		if (result.status === 'committed') {
			expect(await result.finished).toEqual({ status: 'skipped', reason: 'disabled' })
		}
	} finally {
		await test.close()
	}
})

it('pushes and goes Back inside one modal, keeps providers/state, and dismisses the whole flow', async () => {
	const test = await fixture()
	try {
		const view = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		expect(await modal.back()).toEqual({ status: 'at-base' })
		observations.get('coat')!.increment()
		await tick()
		expect((await drive(modal.push({ to: '/items/:id', params: { id: 'hat' } }))).status).toBe(
			'committed',
		)

		expect(native.surfaces).toHaveLength(1)
		changePerson('Jordan')
		await until(
			() =>
				observations.get('coat')?.person === 'Jordan' &&
				observations.get('hat')?.person === 'Jordan',
		)

		expect((await drive(observations.get('hat')!.navigation.back())).status).toBe('committed')
		expect(observations.get('coat')).toMatchObject({ count: 1, person: 'Jordan' })
		let dismissed = false
		const pending = modal.dismiss().then((result) => {
			dismissed = true
			return result
		})

		await until(() => view.closeRequested)
		expect(dismissed).toBe(false)
		view.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect(test.frame.backStack).toHaveLength(0)
		expect((await modal.push({ to: '/items/:id', params: { id: 'glove' } })).status).toBe(
			'cancelled',
		)

		expect(
			(await modal.push({ to: '/items/:id', params: { id: 'glove' }, stack: 'root' })).status,
		).toBe('cancelled')

		expect(test.frame.backStack).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('presents nested modals from their owning surface and returns to the parent match', async () => {
	const test = await fixture()
	try {
		const parent = await test.open('coat')
		const parentNavigation = observations.get('coat')!.navigation
		const child = await test.open('hat', parentNavigation)
		expect(child.parentModal).toBe(parent)
		const pending = observations.get('hat')!.navigation.dismiss()
		await until(() => child.closeRequested)
		child.completeClose()
		expect(await drive(pending)).toMatchObject({
			status: 'committed',
			route: { params: { id: 'coat' } },
		})

		expect(test.platform.modals.getSnapshot()).toHaveLength(1)
		expect(parent.closeRequested).toBe(false)
	} finally {
		await test.close()
	}
})

it('does not present a failed render or a flow without an owning outlet', async () => {
	const test = await fixture()
	try {
		test.router.addRoutes(
			defineRoutes([defineRoute({ path: '/render-failure/:id' }).screen(Broken)]),
			{ id: 'broken', conflict: 'replace' },
		)

		expect(
			await drive(
				test.router.push({
					to: '/render-failure/:id',
					params: { id: 'coat' },
					presentation: 'modal',
				}),
			),
		).toMatchObject({ status: 'failed', phase: 'commit' })

		expect(native.surfaces).toHaveLength(0)
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		removeOwner()
		await tick()
		expect(
			(await test.router.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal' }))
				.status,
		).toBe('blocked')
	} finally {
		await test.close()
	}
})

it('reconciles external native dismissal without reviving the closed flow', async () => {
	const test = await fixture()
	try {
		const view = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		view.completeClose()
		await tick()
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect((await modal.push({ to: '/items/:id', params: { id: 'hat' } })).status).toBe('cancelled')
	} finally {
		await test.close()
	}
})

it('replaces and resets modal history without replacing its native surface', async () => {
	const test = await fixture()
	try {
		const view = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		await drive(modal.push({ to: '/items/:id', params: { id: 'hat' } }))
		await drive(modal.replace({ to: '/items/:id', params: { id: 'cap' } }))
		expect(modal.getSnapshot().canGoBack).toBe(true)
		await drive(modal.reset({ to: '/items/:id', params: { id: 'glove' } }))
		expect(modal.getSnapshot()).toMatchObject({
			route: { params: { id: 'glove' } },
			canGoBack: false,
			modal: true,
		})

		expect(await modal.back()).toEqual({ status: 'at-base' })
		expect(native.surfaces).toEqual([view])
	} finally {
		await test.close()
	}
})

it('serializes a later root modal behind the first accepted presentation', async () => {
	const test = await fixture()
	try {
		const first = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const coat = native.surfaces[0]
		let secondResult: unknown
		const second = test.router
			.push({ to: '/items/:id', params: { id: 'hat' }, presentation: 'modal', transition: 'none' })
			.then((result) => {
				secondResult = result
				return result
			})

		await tick()
		expect(native.surfaces).toHaveLength(1)
		coat.completeShow()
		expect((await drive(first)).status).toBe('committed')
		await until(() => coat.closeRequested)
		expect(native.surfaces).toHaveLength(1)
		observations.get('hat')!.increment()
		await tick()
		coat.completeClose()
		await until(() => native.surfaces.length === 2 || secondResult !== undefined)
		expect(
			secondResult,
			JSON.stringify({ modals: test.platform.modals.getSnapshot(), errors: test.errors }),
		).toBeUndefined()

		expect(observations.get('hat')!.count).toBe(1)
		expect(observations.get('hat')!.navigation.getSnapshot().route).toBeNull()
		native.surfaces[1].completeShow()
		expect((await drive(second)).status).toBe('committed')
		expect(observations.get('hat')!.navigation.getSnapshot().route?.params.id).toBe('hat')
		expect(test.platform.modals.getSnapshot()).toHaveLength(1)
	} finally {
		await test.close()
	}
})

it('closes nested descendants before dismissing a parent surface', async () => {
	const test = await fixture()
	try {
		const parent = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		const child = await test.open('hat', modal)
		const pending = modal.dismiss()
		await until(() => child.closeRequested)
		expect(parent.closeRequested).toBe(false)
		child.completeClose()
		await until(() => parent.closeRequested)
		parent.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('settles owner removal promptly while a native presentation is accepted and completes late', async () => {
	const test = await fixture()
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		removeOwner()
		await tick()
		expect(await drive(pending)).toMatchObject({ status: 'cancelled' })
		view.completeShow()
		await until(() => view.closeRequested)
		view.completeClose()
		await until(() => test.platform.modals.getSnapshot().length === 0)
		expect(test.errors).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('can remount the declaring outlet while its old accepted modal is closing', async () => {
	const test = await fixture()
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		removeOwner()
		await tick()
		expect((await drive(pending)).status).toBe('cancelled')
		restoreOwner()
		await tick()
		view.completeShow()
		await until(() => view.closeRequested)
		view.completeClose()
		await tick()
		await test.open('hat')
		expect(test.errors).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('fails a missing native shown receipt and closes a late presentation only after confirmation', async () => {
	const test = await fixture(15)
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		expect(await drive(pending)).toMatchObject({ status: 'failed', phase: 'commit' })
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect(view.closeRequested).toBe(false)
		expect(theme.unbound).toHaveBeenCalledOnce()
		view.completeShow()
		expect(view.closeRequested).toBe(true)
		view.completeClose()
		expect(theme.unbound).toHaveBeenCalledOnce()
		expect(
			[...view.listeners.values()].every((listeners: Set<unknown>) => listeners.size === 0),
		).toBe(true)
	} finally {
		await test.close()
	}
})

it('settles a missing native dismissal receipt without reviving the modal flow', async () => {
	const test = await fixture(15)
	try {
		const view = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		const pending = modal.dismiss()
		await until(() => view.closeRequested)
		expect(await drive(pending)).toMatchObject({ status: 'failed', phase: 'commit' })
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect(await modal.back()).toMatchObject({ status: 'cancelled', reason: 'disposed' })
		view.completeClose()
		expect(
			[...view.listeners.values()].every((listeners: Set<unknown>) => listeners.size === 0),
		).toBe(true)
	} finally {
		await test.close()
	}
})

it('releases nested flows when the platform externally closes their parent', async () => {
	const test = await fixture()
	try {
		const parent = await test.open('coat')
		const child = await test.open('hat', observations.get('coat')!.navigation)
		const childNavigation = observations.get('hat')!.navigation
		parent.completeClose()
		await until(() => child.closeRequested)
		child.completeClose()
		await until(() => test.platform.modals.getSnapshot().length === 0)
		expect(await childNavigation.back()).toMatchObject({ status: 'cancelled', reason: 'disposed' })
	} finally {
		await test.close()
	}
})

it('claims Android Back for the owning modal flow before the background and legacy handlers', async () => {
	const { registerNativeBackHandler } = await import('./native-back-dispatcher.android')
	const test = await fixture()
	let legacyCalls = 0
	const detach = registerNativeBackHandler('test-legacy', {
		priority: -100,
		handle: () => {
			legacyCalls++
			return true
		},
	})

	const press = (object: unknown, activity: unknown = native.activity) => {
		const event = { cancel: false, object, activity }
		native.backEvents.get('back')!(event)
		return event.cancel
	}

	try {
		const view = await test.open('coat')
		const modal = observations.get('coat')!.navigation
		await drive(modal.push({ to: '/items/:id', params: { id: 'hat' } }))
		expect(press(view)).toBe(true)
		await until(() => modal.getSnapshot().route?.params.id === 'coat')
		expect(view.closeRequested).toBe(false)
		expect(legacyCalls).toBe(0)
		// A different Activity or unrelated SDK modal must keep its own Back.
		detach()
		expect(press(view, {})).toBe(false)
		expect(press({})).toBe(false)
		expect(press(view)).toBe(true)
		await until(() => view.closeRequested)
		view.completeClose()
		await until(() => test.platform.modals.getSnapshot().length === 0)
		expect(test.frame.backStack).toHaveLength(0)
	} finally {
		detach()
		await test.close()
	}
})

it('consumes Android Back during native modal presentation without issuing a competing close', async () => {
	const test = await fixture()
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		const event = { cancel: false, object: view, activity: native.activity }
		native.backEvents.get('back')!(event)
		expect(event.cancel).toBe(true)
		expect(view.closeRequested).toBe(false)
		view.completeShow()
		expect((await drive(pending)).status).toBe('committed')
	} finally {
		await test.close()
	}
})

it('opens a modal from a rendered named pane and keeps both presenter histories independent', async () => {
	const test = await fixture()
	try {
		const pane = bindRouterFlow(test.router, 'other')
		expect((await drive(pane.push({ to: '/items/:id', params: { id: 'pane-coat' } }))).status).toBe(
			'committed',
		)

		observations.get('pane-coat')!.increment()
		await tick()
		const view = await test.open('modal-hat', observations.get('pane-coat')!.navigation)
		const flow = test.platform.modals.getSnapshot().at(-1)!
		expect(flow.presenterFlow).toBe('other')
		expect(test.router.getSnapshot().route).toBeNull()
		expect(pane.getSnapshot().route?.params.id).toBe('pane-coat')
		expect(test.frame.backStack).toHaveLength(0)
		changePerson('Morgan')
		await until(
			() =>
				observations.get('pane-coat')?.person === 'Morgan' &&
				observations.get('modal-hat')?.person === 'Morgan',
		)

		const pending = observations.get('modal-hat')!.navigation.dismiss()
		await until(() => view.closeRequested)
		view.completeClose()
		expect(await drive(pending)).toMatchObject({
			status: 'committed',
			route: { params: { id: 'pane-coat' } },
		})

		expect(observations.get('pane-coat')).toMatchObject({ count: 1, person: 'Morgan' })
		expect((await drive(pane.back())).status).toBe('committed')
		expect(pane.getSnapshot().route).toBeNull()
	} finally {
		await test.close()
	}
})

it('closes a pane-owned modal before a root Frame takeover and preserves the pane history', async () => {
	const test = await fixture()
	try {
		const pane = bindRouterFlow(test.router, 'other')
		await drive(pane.push({ to: '/items/:id', params: { id: 'pane-coat' } }))
		const view = await test.open('modal-hat', pane)
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'root-glove' },
			transition: 'none',
		})

		await until(() => view.closeRequested)
		expect(test.frame.backStack).toHaveLength(0)
		view.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect(pane.getSnapshot().route?.params.id).toBe('pane-coat')
		expect(test.router.getSnapshot().route?.params.id).toBe('root-glove')
	} finally {
		await test.close()
	}
})

it('serializes presentation across a root Frame and a rendered pane in the same window', async () => {
	const test = await fixture()
	try {
		const first = test.router.push({
			to: '/items/:id',
			params: { id: 'root-modal' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const firstView = native.surfaces[0]
		const pane = bindRouterFlow(test.router, 'other')
		const second = pane.push({
			to: '/items/:id',
			params: { id: 'pane-modal' },
			presentation: 'modal',
			transition: 'none',
		})

		await tick()
		expect(native.surfaces).toHaveLength(1)
		firstView.completeShow()
		expect((await drive(first)).status).toBe('committed')
		await until(() => firstView.closeRequested)
		expect(native.surfaces).toHaveLength(1)
		firstView.completeClose()
		await until(() => native.surfaces.length === 2)
		native.surfaces[1].completeShow()
		expect((await drive(second)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toMatchObject([{ presenterFlow: 'other' }])
	} finally {
		await test.close()
	}
})

it('lets an independent pane commit while another pane awaits accepted native presentation', async () => {
	const test = await fixture()
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'root-modal' },
			presentation: 'modal',
			transition: 'none',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		const pane = bindRouterFlow(test.router, 'other')
		expect((await drive(pane.push({ to: '/items/:id', params: { id: 'pane-coat' } }))).status).toBe(
			'committed',
		)

		expect(view.isLoaded).toBe(false)
		expect(view.closeRequested).toBe(false)
		view.completeShow()
		expect((await drive(pending)).status).toBe('committed')
		expect(pane.getSnapshot().route?.params.id).toBe('pane-coat')
	} finally {
		await test.close()
	}
})

it('refreshes a presenter behind nested modals without dismissing either surface', async () => {
	const test = await fixture()
	try {
		await drive(
			test.router.push({ to: '/items/:id', params: { id: 'root-glove' }, transition: 'none' }),
		)

		const parent = await test.open('modal-coat')
		const parentNavigation = observations.get('modal-coat')!.navigation
		const child = await test.open('modal-hat', parentNavigation)
		expect((await drive(test.router.refresh())).status).toBe('committed')
		expect((await drive(parentNavigation.refresh())).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(2)
		expect(parent.isLoaded && child.isLoaded).toBe(true)
		expect(parent.closeRequested || child.closeRequested).toBe(false)
		expect(test.router.getSnapshot().route?.params.id).toBe('root-glove')
	} finally {
		await test.close()
	}
})

it('retains the current modal when a root takeover screen fails before native commitment', async () => {
	const test = await fixture()
	try {
		const view = await test.open('modal-coat')
		const modal = observations.get('modal-coat')!.navigation
		const broken = test.router.addRoutes(
			defineRoutes([defineRoute({ path: '/render-failure/:id' }).screen(Broken)]),
			{ id: 'broken-takeover', conflict: 'replace' },
		)

		try {
			expect(
				await drive(
					test.router.push({
						to: '/render-failure/:id',
						params: { id: 'broken-root' },
						transition: 'none',
					}),
				),
			).toMatchObject({ status: 'failed', phase: 'commit' })

			expect(view.isLoaded).toBe(true)
			expect(view.closeRequested).toBe(false)
			expect(test.platform.modals.getSnapshot()).toHaveLength(1)
			expect(modal.getSnapshot().route?.params.id).toBe('modal-coat')
			expect(test.frame.backStack).toHaveLength(0)
		} finally {
			broken.dispose()
		}
	} finally {
		await test.close()
	}
})

it('honors an explicitly skipped named definition on a native modal surface', async () => {
	const test = await fixture(1000, defineTransitions({ fallback: { kind: 'skip' } }))
	try {
		const opened = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'fallback',
		})

		await until(() => native.surfaces.length === 1)
		const view = native.surfaces[0]
		view.completeShow()
		const result = await drive(opened)
		expect(result.status === 'committed' && (await result.finished)).toEqual({
			status: 'skipped',
			reason: 'disabled',
		})
	} finally {
		await test.close()
	}
})

it('does not let delayed base-owner cleanup cancel navigation from a new keyed owner', async () => {
	const test = await fixture()
	try {
		expect(
			(
				await drive(
					test.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' }),
				)
			).status,
		).toBe('committed')

		remountNavigation = undefined
		remountOwner()
		await until(() => remountNavigation !== undefined)
		expect(await drive(remountNavigation!)).toMatchObject({ status: 'committed' })
		expect(test.router.getSnapshot()).toMatchObject({
			route: { params: { id: 'remounted' } },
			canGoBack: false,
		})
	} finally {
		await test.close()
	}
})

it('keeps a modal open on presenter denial and refreshes its presenter before an admitted close', async () => {
	let account = 'a'
	let allowed = true
	const test = await fixture(1000, undefined, {
		account: () => account,
		title: (id, value) => value + ':' + id,
		guard(id) {
			if (id === 'coat' && !allowed) {
				throw new RouteForbidden()
			}
		},
	})

	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' }))
		const presenter = test.frame.currentPage
		observations.get('coat')!.increment()
		await tick()
		const view = await test.open('hat')
		const owner = observations.get('hat')!.navigation
		allowed = false
		account = 'b'
		expect(await drive(owner.dismiss())).toEqual({ status: 'forbidden' })
		expect(view.isLoaded && !view.closeRequested).toBe(true)
		expect(observations.get('coat')).toMatchObject({ title: 'a:coat', count: 1 })
		allowed = true
		const pending = owner.retry()
		await until(() => view.closeRequested)
		expect(observations.get('coat')).toMatchObject({ title: 'b:coat', count: 1 })
		expect(test.frame.currentPage).toBe(presenter)
		view.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('refreshes the existing parent modal without opening another presentation on child dismissal', async () => {
	let account = 'a'
	const test = await fixture(1000, undefined, {
		account: () => account,
		title: (id, value) => value + ':' + id,
	})

	try {
		const parent = await test.open('coat')
		observations.get('coat')!.increment()
		await tick()
		const child = await test.open('hat', observations.get('coat')!.navigation)
		account = 'b'
		const pending = observations.get('hat')!.navigation.dismiss()
		await until(() => child.closeRequested)
		expect(observations.get('coat')).toMatchObject({ title: 'b:coat', count: 1, person: 'Avery' })
		expect(native.surfaces).toHaveLength(2)
		expect(parent.isLoaded && !parent.closeRequested).toBe(true)
		child.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.platform.modals.getSnapshot()).toHaveLength(1)
	} finally {
		await test.close()
	}
})

it('hands Frame Back to another pane without popping the source Frame or loading twice', async () => {
	let redirect = false
	let loads = 0
	const test = await fixture(1000, undefined, {
		guard(id) {
			if (redirect && id === 'coat') {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'login' }, stack: 'other' })
			}
		},
		title(id) {
			if (id === 'login') {
				loads++
			}

			return id.toUpperCase()
		},
	})

	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' }))
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' }, transition: 'none' }))
		const source = test.frame.currentPage
		const depth = test.frame.backStack.length
		redirect = true
		const result = await drive(test.router.back())
		expect(result.status === 'committed' && result.redirected).toBe(true)
		expect(test.frame.currentPage).toBe(source)
		expect(test.frame.backStack).toHaveLength(depth)
		expect(test.router.forStack('other').getSnapshot().route?.params.id).toBe('login')
		expect(loads).toBe(1)
	} finally {
		await test.close()
	}
})

it('honors an explicit root escape when modal Back redirects from a root-owned flow', async () => {
	let redirect = false
	let loads = 0
	const test = await fixture(1000, undefined, {
		guard(id) {
			if (redirect && id === 'coat') {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'login' }, stack: 'root' })
			}
		},
		title(id) {
			if (id === 'login') {
				loads++
			}

			return id.toUpperCase()
		},
	})

	try {
		await drive(
			test.router.push({ to: '/items/:id', params: { id: 'presenter' }, transition: 'none' }),
		)

		const view = await test.open('coat')
		const owner = observations.get('coat')!.navigation
		await drive(owner.push({ to: '/items/:id', params: { id: 'hat' }, transition: 'none' }))
		redirect = true
		const pending = observations.get('hat')!.navigation.back()
		await until(() => view.closeRequested)
		view.completeClose()
		const result = await drive(pending)
		expect(result.status === 'committed' && result.redirected).toBe(true)
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
		expect(test.router.getSnapshot().route?.params.id).toBe('login')
		expect(loads).toBe(1)
	} finally {
		await test.close()
	}
})

it('prepares a modal presenter redirect before closing and replacing its root Page', async () => {
	let redirect = false
	const test = await fixture(1000, undefined, {
		guard(id) {
			if (redirect && id === 'coat') {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'login' }, stack: 'root' })
			}
		},
	})

	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' }))
		const presenter = test.frame.currentPage
		const view = await test.open('hat')
		redirect = true
		const pending = observations.get('hat')!.navigation.dismiss()
		await until(() => view.closeRequested)
		expect(test.frame.currentPage).toBe(presenter)
		view.completeClose()
		expect((await drive(pending)).status).toBe('committed')
		expect(test.router.getSnapshot().route?.params.id).toBe('login')
		expect(test.platform.modals.getSnapshot()).toHaveLength(0)
	} finally {
		await test.close()
	}
})

it('qualifies sign-in return, expiry and late SDK completion through owned native flows', async () => {
	const frame = new native.Frame()
	const base = frame.currentPage
	const platform = createNativeModalRouterHost({ getFrame: () => frame as any })
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createPortalObjectDriver(),
	)

	const step = async () => {
		await tick()
		for (const surface of native.surfaces) {
			if (surface.showStarted && !surface.isLoaded && !surface.closeRequested) {
				surface.completeShow()
			}

			if (surface.closeRequested) {
				surface.completeClose()
			}
		}
	}

	const waitFor = async (name: string, condition: () => boolean) => {
		for (let tries = 0; tries < 200 && !condition(); tries++) {
			await step()
		}

		expect(condition(), name).toBe(true)
	}

	await qualifyNativeAuthentication({
		host: platform,
		run: async (operation) => {
			let done = false
			const result = operation.finally(() => {
				done = true
			})

			void result.catch(() => {})
			await waitFor('native operation settles', () => done)
			return result
		},
		mount(Component, props) {
			root.render(Component as any, props)
			return () => root.unmount()
		},
		modals: () => platform.modals.getSnapshot().length,
		check: (name, pass) => expect(pass, name).toBe(true),
		wait: waitFor,
		settled: () =>
			waitFor(
				'Frame returns to its declaring base',
				() => frame.currentPage === base && platform.modals.getSnapshot().length === 0,
			),
	})
})

it('commits native modal presentation before its custom content effect finishes', async () => {
	const detail = defineNativeTransition({ view: { from: { opacity: 0 }, duration: 400 } })
	const test = await fixture(1000, defineTransitions({ detail }))
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'detail',
		})

		await until(() => native.surfaces.length === 1)
		const surface = native.surfaces[0]
		expect(surface.options).toMatchObject({ animated: false, cancelable: false })
		surface.completeShow()
		const result = await drive(pending)
		expect(result.status).toBe('committed')
		expect(surface.opacity).toBe(0)
		expect(native.animations).toHaveLength(1)
		if (result.status !== 'committed') {
			throw new Error('Expected a committed modal')
		}

		let finished = false
		void result.finished.then(() => {
			finished = true
		})

		await tick()
		expect(finished).toBe(false)
		native.animations[0].complete()
		expect(await result.finished).toEqual({ status: 'completed' })
		expect(surface.opacity).toBe(1)
	} finally {
		await test.close()
	}
})

it('interrupts modal content motion on guarded dismissal and retains commitment on effect failure', async () => {
	const detail = defineNativeTransition({ view: { from: { opacity: 0 }, duration: 400 } })
	const test = await fixture(1000, defineTransitions({ detail }))
	try {
		const pending = test.router.push({
			to: '/items/:id',
			params: { id: 'coat' },
			presentation: 'modal',
			transition: 'detail',
		})

		await until(() => native.surfaces.length === 1)
		const surface = native.surfaces[0]
		surface.completeShow()
		const result = await drive(pending)
		if (result.status !== 'committed') {
			throw new Error('Expected a committed modal')
		}

		const dismissal = observations.get('coat')!.navigation.dismiss()
		await until(() => surface.closeRequested)
		expect(await result.finished).toEqual({ status: 'skipped', reason: 'interrupted' })
		expect(surface.opacity).toBe(1)
		surface.completeClose()
		expect((await drive(dismissal)).status).toBe('committed')

		const opening = test.router.push({
			to: '/items/:id',
			params: { id: 'hat' },
			presentation: 'modal',
			transition: 'detail',
		})

		await until(() => native.surfaces.length === 2)
		native.surfaces[1].completeShow()
		const committed = await drive(opening)
		if (committed.status !== 'committed') {
			throw new Error('Expected a committed modal')
		}

		const error = new Error('SDK motion failed')
		native.animations[1].fail(error)
		expect(await committed.finished).toEqual({ status: 'failed', error })
		expect(observations.get('hat')?.title).toBe('HAT')
		expect(native.surfaces[1].opacity).toBe(1)
	} finally {
		await test.close()
	}
})

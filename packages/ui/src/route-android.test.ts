import { beforeEach, expect, it, vi } from 'vitest'
import { defineRoutes } from './route-table'
const native = vi.hoisted(() => {
	class View {
		isLoaded = true
		frame: any
		actionBar = { title: '' }
		modal: any = null
		closeCallback: (() => void) | undefined
		showModal(host: any, options: any) { this.modal = host; host.closeCallback = () => { this.modal = null; options.closeCallback() } }
		closeModal() { this.closeCallback?.() }
	}

	class Frame extends View {
		currentPage: any = new View()
		backStack: any[] = []
		listeners = new Map<string, () => void>()
		constructor() { super(); this.currentPage.frame = this }
		on(name: string, cb: () => void) { this.listeners.set(name, cb) }
		navigate({ create }: any) { this.backStack.push(this.currentPage); this.currentPage = create(); this.currentPage.frame = this; this.listeners.get('navigatedTo')?.() }
		goBack() { if (this.backStack.length) {this.currentPage = this.backStack.pop();} this.listeners.get('navigatedTo')?.() }
		callLoaded() { this.isLoaded = true }
	}

	const events = new Map<string, (event: any) => void>()
	const app: any = { android: { on: (name: string, cb: any) => events.set(name, cb) }, AndroidApplication: { activityBackPressedEvent: 'back' }, getRootView: () => null }
	return { View, Frame, app, events, roots: [] as any[] }
})

vi.mock('@nativescript/core', () => ({ Application: native.app, Frame: native.Frame, Page: native.View, GridLayout: native.View }))
vi.mock('octane', () => ({ useSyncExternalStore: vi.fn(), hookSlots: vi.fn() }))
vi.mock('@nativescript-community/octane', () => ({ createNativeScriptRoot: (host: any) => {
	const root = { host, render: vi.fn(), unmount: vi.fn() }; native.roots.push(root); return root
} }))

vi.mock('./route-host.mobile', () => ({ RouteHost: () => null }))
vi.mock('./stacks', async () => import('./stacks.ts'))
let router: typeof import('./route')
let stacks: typeof import('./stacks')
let frame: InstanceType<typeof native.Frame>
beforeEach(async () => {
	vi.resetModules()
	delete native.app.__octaneXplatBackWired
	delete native.app.__octaneXplatBackPress
	native.events.clear(); native.roots.length = 0
	router = await import('./route.ts')
	stacks = await import('./stacks.ts')
	frame = new native.Frame()
	stacks.registerStack('root', frame as any)
	router.registerRoutes(defineRoutes([{ path: 'detail', screen: () => null }]))
})

const push = (stack: string, id: string, presentation?: 'modal') => router.pushRoute({ stack, name: 'detail', params: { id }, presentation })
const back = () => { const event = { cancel: false }; native.events.get('back')!(event); return event.cancel }
it('uses route arrays even when Android has a registered named Frame', () => {
	const named = new native.Frame()
	stacks.registerStack('first', named as any)
	push('first', 'one'); push('first', 'two')
	expect(named.backStack).toHaveLength(0)
	expect(router.routeFor('first')?.params.id).toBe('two')
	router.popRoute('first')
	expect(router.routeFor('first')?.params.id).toBe('one')
})

it('orders interceptors then modal, root, latest named stack and base fall-through', () => {
	push('first', 'one'); push('second', 'two'); push('root', 'root'); push('root', 'modal', 'modal')
	const calls: string[] = []
	const older = router.addBackInterceptor(() => { calls.push('old'); return false })
	const newest = router.addBackInterceptor(() => { calls.push('new'); return true })
	expect(back()).toBe(true)
	expect(calls).toEqual(['new'])
	newest()
	expect(back()).toBe(true)
	expect(calls).toEqual(['new', 'old'])
	expect(router.currentModalRoute()).toBeNull()
	expect(router.routeFor('root')?.params.id).toBe('root')
	older()
	expect(back()).toBe(true)
	expect(router.routeFor('root')).toBeNull()
	expect(back()).toBe(true)
	expect(router.routeFor('second')).toBeNull()
	expect(router.routeFor('first')?.params.id).toBe('one')
	expect(back()).toBe(true)
	expect(back()).toBe(false)
})

it('unmounts the separate modal root exactly once when dismissed', () => {
	push('root', 'modal', 'modal')
	const modalRoot = native.roots.at(-1)
	router.popRoute()
	expect(modalRoot.unmount).toHaveBeenCalledTimes(1)
	expect(router.currentModalRoute()).toBeNull()
})

it('unmounts when the modal host invokes its close callback', () => {
	push('root', 'modal', 'modal')
	const modalRoot = native.roots.at(-1)
	modalRoot.host.closeModal()
	expect(modalRoot.unmount).toHaveBeenCalledTimes(1)
	expect(router.currentModalRoute()).toBeNull()
})

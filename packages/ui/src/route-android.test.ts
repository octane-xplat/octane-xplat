import { beforeEach, expect, it, vi } from 'vitest'
import { defineRoutes } from './route-table'
const native = vi.hoisted(() => {
	class View {
		isLoaded = true
		frame: any
		actionBar = { title: '' }
		modal: any = null
		closeCallback: (() => void) | undefined
		showModal(host: any, options: any) {
			this.modal = host
			host.closeCallback = () => {
				this.modal = null
				options.closeCallback()
			}
		}
		closeModal() {
			this.closeCallback?.()
		}
	}

	class Frame extends View {
		currentPage: any = new View()
		backStack: any[] = []
		listeners = new Map<string, () => void>()
		constructor() {
			super()
			this.currentPage.frame = this
		}
		on(name: string, cb: () => void) {
			this.listeners.set(name, cb)
		}
		navigate({ create }: any) {
			if (this.currentPage) this.backStack.push(this.currentPage)
			this.currentPage = create()
			this.currentPage.frame = this
			this.listeners.get('navigatedTo')?.()
		}
		goBack(target?: any) {
			if (this.backStack.length) {
				const index = target ? this.backStack.indexOf(target) : this.backStack.length - 1
				const entry = this.backStack[index]
				this.backStack.splice(index)
				this.currentPage = entry.resolvedPage ?? entry
			}

			this.listeners.get('navigatedTo')?.()
		}
		callLoaded() {
			this.isLoaded = true
		}
	}

	const events = new Map<string, (event: any) => void>()
	const app: any = {
		android: { on: (name: string, cb: any) => events.set(name, cb) },
		AndroidApplication: { activityBackPressedEvent: 'back' },
		getRootView: () => null,
	}

	return { View, Frame, app, events, roots: [] as any[] }
})

vi.mock('@nativescript/core', () => ({
	Application: native.app,
	Frame: native.Frame,
	Page: native.View,
	GridLayout: native.View,
}))

vi.mock('octane', () => ({ useSyncExternalStore: vi.fn(), hookSlots: vi.fn() }))
vi.mock('@nativescript-community/octane', () => ({
	createNativeScriptRoot: (host: any) => {
		const root = { host, render: vi.fn(), unmount: vi.fn() }
		native.roots.push(root)
		return root
	},
}))

vi.mock('./route-host', () => ({ RouteHost: () => null }))
vi.mock('./stacks', async () => import('./stacks.ts'))
let router: typeof import('./route')
let stacks: typeof import('./stacks')
let frame: InstanceType<typeof native.Frame>
beforeEach(async () => {
	vi.resetModules()
	delete native.app.__octaneXplatBackWired
	delete native.app.__octaneXplatBackPress
	native.events.clear()
	native.roots.length = 0
	router = await import('./route.ts')
	stacks = await import('./stacks')
	frame = new native.Frame()
	stacks.registerStack('root', frame as any)
	router.registerRoutes(defineRoutes([{ path: 'detail', screen: () => null }]))
})

const push = (stack: string, id: string, presentation?: 'modal') =>
	router.pushRoute({ stack, name: 'detail', params: { id }, presentation })

const back = () => {
	const event = { cancel: false }
	native.events.get('back')!(event)
	return event.cancel
}

it('uses route arrays even when Android has a registered named Frame', () => {
	const named = new native.Frame()
	stacks.registerStack('first', named as any)
	push('first', 'one')
	push('first', 'two')
	expect(named.backStack).toHaveLength(0)
	expect(router.routeFor('first')?.params.id).toBe('two')
	router.popRoute('first')
	expect(router.routeFor('first')?.params.id).toBe('one')
})

it('orders interceptors then modal, root, latest named stack and base fall-through', () => {
	push('first', 'one')
	push('second', 'two')
	push('root', 'root')
	push('root', 'modal', 'modal')
	const calls: string[] = []
	const older = router.addBackInterceptor(() => {
		calls.push('old')
		return false
	})

	const newest = router.addBackInterceptor(() => {
		calls.push('new')
		return true
	})

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

it('routes registered with an outlet wait for portal commit and retain hidden backstack entries', async () => {
	const { createContentOwner } = await import('./owned-content')
	const { registerRouteContentOwner } = await import('./route-content-owner')
	const owner = createContentOwner()
	const unregister = registerRouteContentOwner('root', owner)
	const base = frame.currentPage
	push('root', 'first')
	expect(frame.currentPage).toBe(base)
	expect(native.roots).toHaveLength(0)
	owner.entries.getSnapshot()[0].committed()
	const first = frame.currentPage
	push('root', 'second')
	expect(owner.entries.getSnapshot()).toHaveLength(2)
	owner.entries.getSnapshot()[1].committed()
	expect(frame.currentPage).not.toBe(first)
	expect(owner.entries.getSnapshot()).toHaveLength(2)
	frame.goBack()
	expect(frame.currentPage).toBe(first)
	expect(owner.entries.getSnapshot()).toHaveLength(1)
	unregister()
	owner.dispose()
	expect(frame.currentPage).toBe(base)
	expect(owner.entries.getSnapshot()).toHaveLength(0)
})

it('removing an outlet cancels pending page and modal presentation', async () => {
	const { createContentOwner } = await import('./owned-content')
	const { registerRouteContentOwner } = await import('./route-content-owner')
	const owner = createContentOwner()
	const unregister = registerRouteContentOwner('root', owner)
	const base = frame.currentPage
	push('root', 'pending')
	push('root', 'modal', 'modal')
	const pending = [...owner.entries.getSnapshot()]
	expect(pending).toHaveLength(2)
	expect(base.modal).toBeNull()
	unregister()
	owner.dispose()
	for (const entry of pending) entry.committed()
	expect(frame.currentPage).toBe(base)
	expect(base.modal).toBeNull()
	expect(router.currentModalRoute()).toBeNull()
	expect(owner.entries.getSnapshot()).toHaveLength(0)
	expect(native.roots).toHaveLength(0)
})


it('returns to the declaring Page when Android commits its forward stack after owner removal', async () => {
	const { createContentOwner } = await import('./owned-content')
	const { registerRouteContentOwner } = await import('./route-content-owner')
	const owner = createContentOwner()
	const base = frame.currentPage
	owner.host = { page: base }
	frame.currentPage = undefined
	const unregister = registerRouteContentOwner('root', owner)
	push('root', 'late-stack')
	owner.entries.getSnapshot()[0].committed()
	const pushed = frame.currentPage
	frame.backStack = []
	unregister()
	owner.dispose()
	expect(owner.entries.getSnapshot()).toHaveLength(0)
	expect(frame.currentPage).toBe(pushed)
	frame.backStack = [{ resolvedPage: base }]
	frame.listeners.get('navigatedTo')?.()
	await Promise.resolve()
	expect(frame.currentPage).toBe(base)
})

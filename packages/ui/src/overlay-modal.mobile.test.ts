import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

const state = vi.hoisted(() => ({
	hosts: [] as any[],
	portals: [] as any[],
	subscriptions: new Set<() => void>(),
	owner: null as any,
	open: null as any,
	backListeners: new Map<string, (event: any) => void>(),
}))

vi.mock('./native-portal', () => ({
	createPortal: (children: any, target: any) => {
		state.portals.push({ children, target })
		return children
	},
}))

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Screen: { mainScreen: { scale: 1, heightDIPs: 800 } },
	Application: {
		android: {
			on: (event: string, callback: (arg: any) => void) => {
				state.backListeners.set(event, callback)
			},
		},
		AndroidApplication: { activityBackPressedEvent: 'activityBackPressed' },
	},
	GridLayout: class {
		className = ''
		style = {}
		parent: any
		children: any[] = []
		addChild(child: any) {
			this.children.push(child)
			child.parent = this
		}
		getChildAt(index: number) {
			return this.children[index]
		}
		handlers = new Map<string, Set<() => void>>()
		constructor() {
			state.hosts.push(this)
		}
		on(event: string, handler: () => void) {
			const hs = this.handlers.get(event) ?? new Set()
			hs.add(handler)
			this.handlers.set(event, hs)
		}
		off(event: string, handler: () => void) {
			this.handlers.get(event)?.delete(handler)
		}
		notify(event: string) {
			for (const handler of this.handlers.get(event) ?? []) {
				handler()
			}
		}
	},
}))

vi.mock('./root-layout', () => ({ rootLayoutFor: () => state.owner }))
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
vi.mock('./theme/theme-host', () => ({
	applyThemeClasses: (host: any, base: string) => {
		host.className = base
		const listener = () => {
			host.className = base
		}

		state.subscriptions.add(listener)
		return () => {
			state.subscriptions.delete(listener)
		}
	},
}))

import { Overlay } from './Overlay.tsrx'

const mounted: any[] = []
const settle = async () => {
	flushUniversalSync(() => {})
	await new Promise((r) => setTimeout(r, 0))
	flushUniversalSync(() => {})
}

function mount(props: any = {}) {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	mounted.push(root)
	const render = (extra: any = {}) => {
		root.render(Overlay, { open: true, children: 'content', ...props, ...extra })
		flushUniversalSync(() => {})
	}

	render()
	return { root, render }
}

const pressBack = () => {
	const event = { cancel: false }
	state.backListeners.get('activityBackPressed')?.(event)
	return event
}

beforeEach(() => {
	state.hosts.length = 0
	state.portals.length = 0
	state.subscriptions.clear()
	// The dispatcher's global activityBackPressed listener registers
	// once and is reused across tests — keep it.
	state.open = null
	state.owner = {
		children: new Set(),
		popups: new Set(),
		open: vi.fn((host: any) => {
			host.parent = state.owner
			state.owner.children.add(host)
			state.owner.popups.add(host)
			return state.open ?? Promise.resolve()
		}),
		hasChild: (host: any) => state.owner.children.has(host),
		getPopupIndex: (host: any) => (state.owner.popups.has(host) ? 0 : -1),
		removeChild: vi.fn((host: any) => {
			state.owner.children.delete(host)
			host.parent = null
		}),
		close: vi.fn(async (host: any) => {
			state.owner.popups.delete(host)
			host.notify('closed')
			state.owner.removeChild(host)
		}),
	}
})

afterEach(async () => {
	for (const root of mounted.splice(0)) {
		root.unmount()
	}

	await settle()
})

describe('Overlay isModal on Android', () => {
	it('dismisses on Android Back while open, without a shade', async () => {
		const dismiss = vi.fn()
		mount({ isModal: true, onDismiss: dismiss })
		await settle()
		const event = pressBack()
		expect(dismiss).toHaveBeenCalledTimes(1)
		expect(event.cancel).toBe(true)
	})

	it('unregisters the interceptor when the overlay closes', async () => {
		const dismiss = vi.fn()
		const { render } = mount({ isModal: true, onDismiss: dismiss })
		await settle()
		render({ open: false })
		await settle()
		const event = pressBack()
		expect(dismiss).not.toHaveBeenCalled()
		expect(event.cancel).toBe(false)
	})

	it('registers no interceptor without isModal or shadeCover', async () => {
		const dismiss = vi.fn()
		mount({ onDismiss: dismiss })
		await settle()
		const event = pressBack()
		expect(dismiss).not.toHaveBeenCalled()
		expect(event.cancel).toBe(false)
	})

	it('also dismisses shadeCover overlays on Android Back', async () => {
		const dismiss = vi.fn()
		mount({ shadeCover: true, onDismiss: dismiss })
		await settle()
		const event = pressBack()
		expect(dismiss).toHaveBeenCalledTimes(1)
		expect(event.cancel).toBe(true)
	})
})

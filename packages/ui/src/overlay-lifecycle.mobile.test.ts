import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

const state = vi.hoisted(() => ({
	hosts: [] as any[],
	roots: [] as any[],
	subscriptions: new Set<() => void>(),
	owner: null as any,
	open: null as any,
	cleanup: [] as any[],
	enter: vi.fn(),
}))

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: false,
	Screen: { mainScreen: { scale: 1 } },
	GridLayout: class {
		className = ''
		style = {}
		parent: any
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

vi.mock('@nativescript-community/octane', async (original) => ({
	...(await original<Record<string, unknown>>()),
	createNativeScriptRoot: () => {
		const root = { render: vi.fn(), unmount: vi.fn() }
		state.roots.push(root)
		return root
	},
}))

vi.mock('./root-layout', () => ({ rootLayoutFor: () => state.owner }))
vi.mock('./theme/theme-scheme', () => ({
	useThemeScheme: () => 'light',
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

vi.mock('./keyboard-inset', () => ({
	bindBottomInsetToKeyboard: () => {
		const off = vi.fn()
		state.cleanup.push(off)
		return off
	},
}))

vi.mock('./tap-to-blur', () => ({
	attachTapToBlur: () => {
		const off = vi.fn()
		state.cleanup.push(off)
		return off
	},
}))

vi.mock('./sheet-detents', () => ({
	attachSheetDetents: () => {
		const off = vi.fn()
		state.cleanup.push(off)
		return { detach: off, enter: state.enter }
	},
}))

import { Overlay } from './Overlay.tsrx'
import { BottomSheet } from './BottomSheet.tsrx'
import { Popover } from './Popover.tsrx'
const mounted: any[] = []
const settle = async () => {
	flushUniversalSync(() => {})
	await new Promise((r) => setTimeout(r, 0))
	flushUniversalSync(() => {})
}

function mount(Component: any, props: any = {}, mapProps: (p: any) => any = (p) => p) {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	mounted.push(root)
	const render = (extra: any = {}) => {
		root.render(
			Component,
			mapProps({
				open: true,
				children: 'content',
				anchor: { current: {} },
				...props,
				...extra,
			}),
		)

		flushUniversalSync(() => {})
	}

	render()
	return { root, render }
}

beforeEach(() => {
	state.hosts.length = 0
	state.roots.length = 0
	state.cleanup.length = 0
	state.subscriptions.clear()
	state.enter.mockClear()
	state.open = null
	state.owner = {
		children: new Set(),
		popups: new Set(),
		open: vi.fn((host: any) => {
			state.owner.children.add(host)
			state.owner.popups.add(host)
			host.parent = state.owner
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

const sheetProps = (p: any) => ({
	isOpen: p.open,
	label: 'Sheet',
	snapPoints: p.detents,
	onOpenChange: (open: boolean) => {
		if (!open) {p.onDismiss?.()}
	},
	children: p.children,
})

describe.each([
	['Overlay', Overlay, (p: any) => p],
	['BottomSheet', BottomSheet, sheetProps],
	['Popover', Popover, (p: any) => p],
] as const)('%s native lifetime', (_, Component, mapProps) => {
	it('releases its host, root and subscriptions when its owner unmounts', async () => {
		const dismiss = vi.fn()
		const { root } = mount(Component, { onDismiss: dismiss, detents: [0.5, 1] }, mapProps)
		await settle()
		root.unmount()
		await settle()
		expect(state.owner.children.size).toBe(0)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
		expect(state.subscriptions.size).toBe(0)
		expect(dismiss).not.toHaveBeenCalled()
		for (const off of state.cleanup) {
			expect(off).toHaveBeenCalledTimes(1)
		}
	})

	it('releases everything on programmatic close without reporting dismissal', async () => {
		const dismiss = vi.fn()
		const { render } = mount(Component, { onDismiss: dismiss, detents: [0.5, 1] }, mapProps)
		await settle()
		render({ open: false })
		await settle()
		expect(state.owner.children.size).toBe(0)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
		expect(state.subscriptions.size).toBe(0)
		expect(dismiss).not.toHaveBeenCalled()
	})

	it('ignores late open completion after unmount', async () => {
		let finish!: () => void
		state.open = new Promise<void>((r) => {
			finish = r
		})

		const { root } = mount(Component, { detents: [0.5, 1] }, mapProps)
		await settle()
		root.unmount()
		await settle()
		finish()
		await settle()
		expect(state.owner.children.size).toBe(0)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
		expect(state.enter).not.toHaveBeenCalled()
	})

	it('cleans up a rejected open', async () => {
		let fail!: (e: Error) => void
		state.open = new Promise((_, reject) => {
			fail = reject
		})

		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		mount(Component, { detents: [0.5, 1] }, mapProps)
		await settle()
		fail(new Error('open failed'))
		await settle()
		expect(state.owner.children.size).toBe(0)
		expect(state.subscriptions.size).toBe(0)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
		for (const off of state.cleanup) {
			expect(off).toHaveBeenCalledTimes(1)
		}

		error.mockRestore()
	})

	it('does not remove a host already closing through RootLayout', async () => {
		const { root } = mount(Component, {}, mapProps)
		await settle()
		const host = state.hosts[0]
		state.owner.popups.delete(host)
		root.unmount()
		await settle()
		expect(state.owner.close).not.toHaveBeenCalled()
		expect(state.owner.removeChild).not.toHaveBeenCalled()
		host.notify('closed')
		state.owner.removeChild(host)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
	})

	it('detaches a host when its close animation rejects', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { root } = mount(Component, {}, mapProps)
		await settle()
		state.owner.close.mockImplementation(async (host: any) => {
			state.owner.popups.delete(host)
			throw new Error('close failed')
		})

		root.unmount()
		await settle()
		expect(state.owner.children.size).toBe(0)
		expect(state.subscriptions.size).toBe(0)
		error.mockRestore()
	})

	it('keeps a reopened host alive when the old open rejects later', async () => {
		let fail!: (e: Error) => void
		state.open = new Promise((_, reject) => {
			fail = reject
		})

		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { render } = mount(Component, {}, mapProps)
		await settle()
		render({ open: false })
		await settle()
		state.open = null
		render({ open: true })
		await settle()
		fail(new Error('old open'))
		await settle()
		expect(state.owner.children.size).toBe(1)
		expect(state.roots[0].unmount).toHaveBeenCalledTimes(1)
		expect(state.roots[1].unmount).not.toHaveBeenCalled()
		error.mockRestore()
	})

	it('uses the latest dismissal callback and never reenters a platform close', async () => {
		const old = vi.fn(),
			current = vi.fn()

		const { render } = mount(Component, { onDismiss: old }, mapProps)
		await settle()
		render({ onDismiss: current, children: 'updated' })
		await settle()
		await state.owner.close(state.hosts[0])
		await settle()
		expect(old).not.toHaveBeenCalled()
		expect(current).toHaveBeenCalledTimes(1)
		expect(state.owner.close).toHaveBeenCalledTimes(1)
		expect(state.subscriptions.size).toBe(0)
	})
})

it('Overlay replaces theme subscriptions when content or classes update', async () => {
	const { render } = mount(Overlay)
	await settle()
	render({ className: 'new', children: 'updated' })
	await settle()
	expect(state.subscriptions.size).toBe(1)
	expect(state.hosts[0].className).toContain('new')
	render({ open: false })
	await settle()
	expect(state.subscriptions.size).toBe(0)
})

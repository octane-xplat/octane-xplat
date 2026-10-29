/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { DropdownMenuItem } from './MenuParts.macos.tsrx'
afterEach(() => vi.unstubAllGlobals())
function mount() {
	const claims = new Set<any>(), retained = new Set<any>(), observers = new Map<any, any>(), calls: any[] = []
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true,
		suppressTabStop(view: any) { claims.add(view); return () => claims.delete(view) },
		retainFocusTarget(view: any) { retained.add(view); return () => retained.delete(view) },
	})
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: any, __: any, ___: any, callback: any) { const token = {}; observers.set(token, callback); return token },
		removeObserver(token: any) { observers.delete(token) },
	} })
	const window: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (view.window !== this || !view.isAccessibilityEnabled()) return false
		calls.push(view); this.firstResponder = view; return true
	} }
	function Fixture(props: any) {
		return <MenuSurface closeMenu={() => {}} initialFocus="first" label="Actions">
			{props.items.map((item: any) => <DropdownMenuItem key={item.id} id={item.id} label={item.id} isDisabled={item.disabled}
				onSelect={props.pick} hasCloseOnSelect={false} endContent={item.id === 'a' ? <textfield id="editor" /> : undefined} />)}
		</MenuSurface>
	}
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript')), picked = vi.fn()
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const node = (id: string) => all().find((node) => node.props?.id === id)
	const panel = () => all().find((node) => String(node.props?.className).split(' ').includes('vx-menu-list--appkit'))
	const hydrate = (view: any) => {
		view.window = window; view.bounds = {}; view.scrollRectToVisible = () => {}; view.isAccessibilityEnabled = () => !view.props?.accessibilityState?.disabled
		view.subviews = { get count() { return view.children?.length ?? 0 }, objectAtIndex: (i: number) => view.children[i] }
		for (const child of view.children ?? []) { child.superview = view; hydrate(child) }
	}
	const flush = () => { flushUniversalSync(() => {}); for (const child of container.children) hydrate(child) }
	const render = (items: any[]) => { root.render(Fixture, { items, pick: picked }); flush() }
	const notify = () => { for (const callback of observers.values()) callback({ object: window }) }
	render([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
	return { root, window, claims, retained, observers, calls, node, panel, flush, render, notify, picked }
}
it('row detach/disabled updates queue same-position repair, then fall back to the retained menu container without selecting', async () => {
	const f = mount()
	try {
		await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.node('a')) })
		f.panel().props.onKeyDown({ key: 'ArrowDown', preventDefault() {}, stopPropagation() {} })
		expect(f.window.firstResponder).toBe(f.node('b'))
		f.render([{ id: 'a' }, { id: 'c' }])
		await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.node('c')) })
		f.render([{ id: 'a' }, { id: 'c', disabled: true }])
		await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.node('a')) })
		f.render([]); await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.panel()) })
		expect(f.picked).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
	expect(f.claims.size).toBe(0); expect(f.retained.size).toBe(0); expect(f.observers.size).toBe(0)
})
it('row mutations preserve nested field editors and an external menu responder', async () => {
	const f = mount()
	try {
		await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.node('a')) })
		for (const external of [f.node('editor'), { delegate: f.node('editor'), fieldEditor: true }, { otherMenu: true }]) {
			f.window.firstResponder = external; f.notify()
			const before = f.calls.length; f.render([{ id: 'a' }, { id: 'b', disabled: true }])
			await Promise.resolve(); f.flush(); expect(f.window.firstResponder).toBe(external); expect(f.calls).toHaveLength(before)
		}
	} finally { f.root.unmount() }
})
it('old-window detach observation releases claims and queued row repair does not focus after teardown', async () => {
	const f = mount()
	try {
		await vi.waitFor(() => { f.flush(); expect(f.window.firstResponder).toBe(f.node('a')) })
		f.panel().window = null; f.notify(); expect(f.claims.size).toBe(0)
		f.flush(); f.notify(); f.render([{ id: 'b' }]); f.root.unmount()
		const before = f.calls.length; await Promise.resolve(); f.flush(); expect(f.calls).toHaveLength(before)
	} finally { f.root.unmount() }
	expect(f.claims.size).toBe(0); expect(f.retained.size).toBe(0); expect(f.observers.size).toBe(0)
})

import { expect, it, vi } from 'vitest'
import { createAppKitToolbarFocus } from './toolbar-focus.macos'

function fixture() {
	const leases = new Map<any, number>(), observers = new Map<object, (note: any) => void>(), removed: object[] = []
	const state = { orientation: 'horizontal' as 'horizontal' | 'vertical', supported: true, allow: true,
		onFocus: () => {}, onAcquire: () => {}, onObserve: () => {}, failRelease: false, releases: 0 }
	const window = (): any => ({ firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) {
		if (!state.allow || view.window !== this) return false
		this.firstResponder = view; state.onFocus(); return true
	} })
	const firstWindow = window()
	const view = (id: string, role = 'AXButton'): any => ({ id, role, window: firstWindow, children: [] as any[], disabled: false, hidden: false,
		get subviews() { return { count: this.children.length, objectAtIndex: (index: number) => this.children[index] } },
		accessibilityRole() { return this.role }, acceptsFirstResponder() { return this.role !== 'AXToolbar' && !this.disabled },
		isAccessibilityEnabled() { return !this.disabled }, canBecomeKeyView() { return !this.disabled && !leases.has(this) },
		bounds: {}, scrollRectToVisible() {},
	})
	const root = view('root', 'AXToolbar'), a = view('a'), b = view('b'), c = view('c')
	root.children = [a, b, c]
	const bridge = { get keyboardEventsSupported() { return state.supported }, suppressTabStop(target: any) {
		leases.set(target, (leases.get(target) ?? 0) + 1); state.onAcquire()
		return () => { state.releases++; const count = leases.get(target) ?? 0; if (count <= 1) leases.delete(target); else leases.set(target, count - 1)
			if (state.failRelease) throw new Error('bridge removal') }
	} }
	const center = { addObserverForNameObjectQueueUsingBlock(_name: string, _object: unknown, _queue: unknown, notify: (note: any) => void) {
		const token = {}; observers.set(token, notify); state.onObserve(); return token
	}, removeObserver(token: object) { removed.push(token); observers.delete(token) } }
	let nativeCenter: any = center
	const focus = createAppKitToolbarFocus({ orientation: () => state.orientation }, () => bridge,
		() => ({ NSNotificationCenter: { defaultCenter: nativeCenter }, NSWindowDidUpdateNotification: 'update' }))
	const notify = (owner = root.window) => { for (const callback of [...observers.values()]) callback({ object: owner }) }
	const key = (name: string, extra = {}) => {
		const event = { key: name, code: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false,
			isComposing: false, defaultPrevented: false, stopped: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		focus.keyDown(event); return event
	}
	return { state, root, a, b, c, view, window, focus, leases, observers, removed, notify, key, setCenter: (value: any) => { nativeCenter = value } }
}

it('toolbar actions have one roving entry and arrows/edges move focus without activation', async () => {
	const f = fixture(); f.focus.bind(f.root); await Promise.resolve()
	try {
		expect(f.root.window.firstResponder).toBeNull(); expect([...f.leases.keys()]).toEqual([f.b, f.c])
		f.root.window.firstResponder = f.a
		expect(f.key('ArrowRight').stopped).toBe(true); expect(f.root.window.firstResponder).toBe(f.b)
		expect(f.leases.has(f.b)).toBe(false); expect(f.leases.has(f.a)).toBe(true)
		f.key('End'); expect(f.root.window.firstResponder).toBe(f.c)
		f.key('ArrowRight'); expect(f.root.window.firstResponder).toBe(f.a)
		f.key('Home'); expect(f.root.window.firstResponder).toBe(f.a)
		expect(f.key('Enter').defaultPrevented).toBe(false); expect(f.key('Tab').defaultPrevented).toBe(false)
	} finally { f.focus.dispose() }
})

it('toolbar uses current axis and preserves modified, composing, prevented and refused focus events', async () => {
	const f = fixture(); f.focus.bind(f.root); await Promise.resolve()
	try {
		f.root.window.firstResponder = f.a; expect(f.key('ArrowDown').defaultPrevented).toBe(false)
		f.state.orientation = 'vertical'; expect(f.key('ArrowRight').defaultPrevented).toBe(false)
		f.key('ArrowDown'); expect(f.root.window.firstResponder).toBe(f.b)
		for (const flag of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing', 'defaultPrevented']) {
			expect(f.key('ArrowDown', { [flag]: true }).stopped).toBe(false)
		}
		f.state.allow = false; expect(f.key('End').defaultPrevented).toBe(false); expect(f.root.window.firstResponder).toBe(f.b)
	} finally { f.focus.dispose() }
})

it('editors, adjustable controls, nested composites and foreign responders keep their input and Tab stops', async () => {
	const f = fixture(), editor = f.view('editor', 'AXTextField'), slider = f.view('slider', 'AXSlider'), nested = f.view('nested', 'AXToolbar')
	const nestedButton = f.view('nested-button'); nested.children = [nestedButton]; f.a.children = [editor]
	f.root.children = [f.a, slider, nested, f.b]; f.focus.bind(f.root); await Promise.resolve()
	try {
		for (const target of [editor, slider, nestedButton, f.view('foreign')]) {
			f.root.window.firstResponder = target; expect(f.key('Home').defaultPrevented).toBe(false)
			expect(f.leases.has(target)).toBe(false)
		}
		f.root.window.firstResponder = f.a; f.key('ArrowRight'); expect(f.root.window.firstResponder).toBe(f.b)
	} finally { f.focus.dispose() }
})

it('window updates rebuild native order and skip changed disabled, hidden and removed actions', async () => {
	const f = fixture(); f.focus.bind(f.root); await Promise.resolve()
	try {
		f.b.isAccessibilityEnabled = () => 0; f.c.hidden = true; f.notify(); expect(f.leases.size).toBe(0)
		f.c.hidden = false; f.root.children = [f.c, f.a]; f.notify()
		expect([...f.leases.keys()]).toEqual([f.a]); f.root.window.firstResponder = f.c
		f.key('ArrowRight'); expect(f.root.window.firstResponder).toBe(f.a)
		f.root.children = [f.c]; f.notify(); expect(f.leases.size).toBe(0)
		// Removing the responder repairs entry eligibility without moving focus.
		expect(f.root.window.firstResponder).toBe(f.a); expect(f.key('Home').defaultPrevented).toBe(false)
	} finally { f.focus.dispose() }
})

it('toolbar window migration releases old entries and leaves unrelated windows alone', async () => {
	const f = fixture(); f.focus.bind(f.root); await Promise.resolve()
	try {
		const previous = f.root.window, next = f.window()
		for (const view of [f.root, f.a, f.b, f.c]) view.window = next
		f.notify(previous); expect(next.firstResponder).toBeNull(); expect(f.leases.size).toBe(2)
		next.firstResponder = f.b; f.key('ArrowRight'); expect(next.firstResponder).toBe(f.c)
		const releases = f.state.releases; f.notify(f.window()); expect(f.state.releases).toBe(releases)
	} finally { f.focus.dispose() }
})

it('teardown uses the captured observer remover and leaves held delivery/keys inert', async () => {
	const f = fixture(); f.focus.bind(f.root); await Promise.resolve()
	const notify = [...f.observers.values()][0]
	f.setCenter({ removeObserver() { throw new Error('wrong center') } })
	f.focus.dispose(); expect(f.observers.size).toBe(0); expect(f.removed).toHaveLength(1); expect(f.leases.size).toBe(0)
	f.root.window.firstResponder = f.a; notify({ object: f.root.window }); expect(f.key('ArrowRight').defaultPrevented).toBe(false)
	expect(f.root.window.firstResponder).toBe(f.a)
})

it('missing observation or keyboard capability preserves natural stops and unconsumed keys', async () => {
	for (const missingObserver of [true, false]) {
		const f = fixture()
		if (missingObserver) f.setCenter(undefined); else f.state.supported = false
		f.focus.bind(f.root); await Promise.resolve()
		try { f.root.window.firstResponder = f.a; expect(f.leases.size).toBe(0); expect(f.key('ArrowRight').defaultPrevented).toBe(false) }
		finally { f.focus.dispose() }
	}
})

it('late observer and Tab acquisitions after reentrant teardown release their own handles', async () => {
	for (const stage of ['observer', 'tab']) {
		const f = fixture()
		if (stage === 'observer') f.state.onObserve = () => f.focus.dispose()
		else f.state.onAcquire = () => f.focus.dispose()
		f.focus.bind(f.root); await Promise.resolve()
		expect(f.observers.size).toBe(0); expect(f.leases.size).toBe(0)
		f.focus.dispose()
	}
})

it('Tab cleanup failures attempt every captured lease and nested focus reentry is ignored', async () => {
	const f = fixture(), warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	f.focus.bind(f.root); await Promise.resolve()
	try {
		f.root.window.firstResponder = f.a; f.state.onFocus = () => f.key('End')
		f.key('ArrowRight'); expect(f.root.window.firstResponder).toBe(f.b)
		f.state.failRelease = true; f.focus.dispose()
		expect(f.leases.size).toBe(0); expect(f.observers.size).toBe(0); expect(warn).toHaveBeenCalled()
	} finally { warn.mockRestore(); f.focus.dispose() }
})

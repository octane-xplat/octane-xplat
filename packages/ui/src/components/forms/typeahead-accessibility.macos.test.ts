import { expect, it, vi } from 'vitest'
import { createAppKitTypeaheadAccessibility } from './typeahead-accessibility.macos'
function fixture() {
	const window: any = { firstResponder: {}, makeFirstResponder: vi.fn() }, label = {}, previous = {}
	const input: any = { window, accessibilityLinkedUIElements: [label], accessibilitySelectedChildren: [previous] }
	const list: any = { window, accessibilityLinkedUIElements: [], accessibilitySelectedChildren: [] }
	const row: any = { window, isDescendantOf: (view: unknown) => view === list }
	const state: any = { input, list, active: row, open: true, blocked: false }, observers = new Map<object, any>(), notifications = vi.fn()
	const host = { NSAccessibilityPostNotification: notifications, NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: string, __: unknown, ___: unknown, callback: any) { const token = {}; observers.set(token, callback); return token }, removeObserver(token: object) { observers.delete(token) },
	} } }
	const controller = createAppKitTypeaheadAccessibility(() => state, () => host), flush = async () => { controller.update(); await Promise.resolve() }
	const notify = (object = window) => { for (const callback of [...observers.values()]) {callback({ object })} }
	return { window, label, previous, input, list, row, state, observers, notifications, controller, flush, notify }
}
it('links current native input/list, preserves unrelated links and exposes pending selection without moving focus', async () => {
	const f = fixture(), responder = f.window.firstResponder
	try {
		await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label, f.list]); expect(f.list.accessibilityLinkedUIElements).toEqual([f.input])
		expect(f.input.accessibilitySelectedChildren).toEqual([f.row]); expect(f.list.accessibilitySelectedChildren).toEqual([f.row]); expect(f.notifications).toHaveBeenCalledExactlyOnceWith(f.list, 'AXSelectedChildrenChanged')
		expect(f.window.firstResponder).toBe(responder); expect(f.window.makeFirstResponder).not.toHaveBeenCalled()
		await f.flush(); expect(f.notifications).toHaveBeenCalledTimes(1)
	} finally { f.controller.dispose() }
})
it('current active-row replacement and removal update native selection once each', async () => {
	const f = fixture(), row = { window: f.window, isDescendantOf: (view: unknown) => view === f.list }
	try {
		await f.flush(); f.state.active = row; await f.flush(); expect(f.list.accessibilitySelectedChildren).toEqual([row]); expect(f.notifications).toHaveBeenCalledTimes(2)
		f.state.active = null; await f.flush(); expect(f.input.accessibilitySelectedChildren).toEqual([]); expect(f.list.accessibilitySelectedChildren).toEqual([]); expect(f.notifications).toHaveBeenCalledTimes(3)
	} finally { f.controller.dispose() }
})
it('closed or blocked lists restore native baselines and release attachment observation', async () => {
	for (const key of ['open', 'blocked']) {
		const f = fixture()
		try {
			await f.flush(); f.state[key] = key === 'blocked'; await f.flush()
			expect(f.input.accessibilityLinkedUIElements).toEqual([f.label]); expect(f.input.accessibilitySelectedChildren).toEqual([f.previous]); expect(f.list.accessibilityLinkedUIElements).toEqual([]); expect(f.observers.size).toBe(0)
		} finally { f.controller.dispose() }
	}
})
it('late attachment observes the current window and foreign notifications do not bind stale views', async () => {
	const f = fixture(); f.input.window = null; f.list.window = null
	try {
		await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label]); expect(f.observers.size).toBe(1)
		f.input.window = f.window; f.list.window = f.window; f.notify({}); await Promise.resolve(); expect(f.notifications).not.toHaveBeenCalled()
		f.notify(); await Promise.resolve(); expect(f.list.accessibilitySelectedChildren).toEqual([f.row])
	} finally { f.controller.dispose() }
})
it('foreign/hidden rows and lists cannot publish pending native selection', async () => {
	const f = fixture()
	try {
		await f.flush(); f.row.window = {}; await f.flush(); expect(f.list.accessibilitySelectedChildren).toEqual([])
		f.row.window = f.window; f.row.hiddenOrHasHiddenAncestor = () => true; await f.flush(); expect(f.list.accessibilitySelectedChildren).toEqual([])
		f.list.window = {}; await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label])
		f.list.window = f.window; f.list.hidden = true; await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label])
	} finally { f.controller.dispose() }
})
it('replacement native owners restore old metadata and bind the current owner baseline', async () => {
	const f = fixture(), label = {}, input: any = { window: f.window, accessibilityLinkedUIElements: [label], accessibilitySelectedChildren: [] }
	try {
		await f.flush(); f.state.input = input; await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label]); expect(input.accessibilityLinkedUIElements).toEqual([label, f.list])
		f.controller.dispose(); expect(input.accessibilityLinkedUIElements).toEqual([label]); expect(f.list.accessibilityLinkedUIElements).toEqual([])
	} finally { f.controller.dispose() }
})
it('old-window notification releases detached metadata and current reattachment can bind again', async () => {
	const f = fixture()
	try {
		await f.flush(); f.input.window = null; f.list.window = null; f.notify(); await Promise.resolve(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label])
		const window = {}; f.input.window = window; f.list.window = window; f.row.window = window; f.notify(window); await Promise.resolve(); expect(f.list.accessibilitySelectedChildren).toEqual([f.row])
	} finally { f.controller.dispose() }
})
it('native NSArray baselines preserve order and deduplicate the owned relationship', async () => {
	const f = fixture(), links = [f.label, f.list]
	f.input.accessibilityLinkedUIElements = { count: links.length, objectAtIndex: (index: number) => links[index] }
	try { await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual(links) } finally { f.controller.dispose() }
	expect(f.input.accessibilityLinkedUIElements.objectAtIndex(0)).toBe(f.label)
})
it('dispose retires queued work and held native observers without republishing relationships', async () => {
	const f = fixture(); await f.flush(); f.notifications.mockClear(); f.controller.update(); const callbacks = [...f.observers.values()]; f.controller.dispose(); await Promise.resolve()
	callbacks.forEach((callback) => callback({ object: f.window })); await f.flush()
	expect(f.input.accessibilityLinkedUIElements).toEqual([f.label]); expect(f.notifications).not.toHaveBeenCalled(); expect(f.observers.size).toBe(0)
})

it('a failed native relationship write restores partial ownership and can retry on a new update', async () => {
	const f = fixture(), warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	let links: any[] = [], fail = true
	Object.defineProperty(f.list, 'accessibilityLinkedUIElements', { configurable: true, get: () => links, set(value) { if (fail) { fail = false; throw Error('native write refused') }; links = value } })
	try {
		await f.flush(); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label]); expect(f.observers.size).toBe(0); expect(warn).toHaveBeenCalled()
		await f.flush(); expect(f.list.accessibilitySelectedChildren).toEqual([f.row]); expect(f.input.accessibilityLinkedUIElements).toEqual([f.label, f.list])
	} finally { f.controller.dispose(); warn.mockRestore() }
})

/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { PowerSearchView } from './PowerSearchView.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { createInternalConfig, createPowerSearchConfig } from './power-search-config'
vi.mock('../overlays/Popover.macos.tsrx', () => ({ Popover: () => null }))
afterEach(() => vi.unstubAllGlobals())
const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
function mount(extra: any = {}, inherited = false) {
	const observers = new Map<object, any>(), monitors = new Map<object, any>(), calls: any[] = []
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, _: any, __: any, callback: any) { const token = {}; observers.set(token, { name, callback }); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('NSEvent', { addLocalMonitorForEventsMatchingMaskHandler(_: number, callback: any) { const token = {}; monitors.set(token, callback); return token }, removeMonitor(token: object) { monitors.delete(token) } })
	const window: any = { firstResponder: {}, makeFirstResponder(view: any) { calls.push(view); window.firstResponder = view; return true } }
	const container = createObjectContainer('nativescript'), driver = createObjectDriver('nativescript'), getPublicInstance = driver.getPublicInstance
	driver.getPublicInstance = (node: any) => { const view: any = getPublicInstance(node); if (node.type === 'textfield' && !('currentEditor' in view)) { view.window = null; view.currentEditor = () => null }; return view }
	const root = createUniversalRoot(container, driver), handles: any[] = []
	const base = { config, internal: createInternalConfig(config), query: '', filters: [], results: [], editing: null, suggestionsOpen: false, hasAutoFocus: true,
		onQueryChange: vi.fn(), onInputFocus: vi.fn(), onDismiss: vi.fn(), onCancel: vi.fn(), onEdit: vi.fn(), onChoose: vi.fn(), onRemove: vi.fn(), onClear: vi.fn(), onSave: vi.fn(), handleRef: (handle: any) => handles.push(handle), ...extra }
	function Fixture(props: any) { return inherited ? <FormField label="Search" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading}><PowerSearchView {...props} isDisabled={undefined} isReadOnly={undefined} isLoading={undefined} /></FormField> : <PowerSearchView {...props} /> }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const input = () => all().find((node) => node.type === 'textfield')
	const render = (props: any) => flushUniversalSync(() => root.render(Fixture, props))
	const settle = async () => { await Promise.resolve(); flushUniversalSync(() => {}); await Promise.resolve(); flushUniversalSync(() => {}) }
	const notify = () => { for (const observer of [...observers.values()]) if (observer.name === 'NSWindowDidUpdateNotification') observer.callback({ object: window }) }
	render(base)
	return { root, base, render, settle, notify, input, window, calls, handles, observers, monitors }
}
it('waits for the native input to attach, then focuses once without emitting edit/focus intents', async () => {
	const f = mount()
	try {
		await f.settle(); expect(f.calls).toEqual([]); f.input().window = f.window; f.notify(); await f.settle(); expect(f.calls).toEqual([f.input()])
		f.render({ ...f.base, placeholder: 'Updated' }); f.notify(); await f.settle(); expect(f.calls).toHaveLength(1)
		expect(f.base.onQueryChange).not.toHaveBeenCalled(); expect(f.base.onInputFocus).not.toHaveBeenCalled(); expect(f.monitors.size).toBe(0)
	} finally { f.root.unmount() }
	expect(f.observers.size).toBe(0)
})
it('user input, flag removal and teardown retire delayed work and native observation', async () => {
	for (const reason of ['input', 'flag', 'unmount']) {
		const f = mount()
		try {
			await f.settle(); const input = f.input(), callbacks = [...f.observers.values()]
			if (reason === 'input') { const event = {}; expect([...f.monitors.values()][0](event)).toBe(event) }
			if (reason === 'flag') f.render({ ...f.base, hasAutoFocus: false })
			if (reason === 'unmount') f.root.unmount()
			input.window = f.window; callbacks.forEach((observer) => observer.callback({ object: f.window })); await f.settle(); expect(f.calls).toEqual([])
		} finally { f.root.unmount() }
		expect(f.observers.size).toBe(0); expect(f.monitors.size).toBe(0)
	}
})
it('current inherited blocking cancels and unblocking alone does not rearm; false-to-true does', async () => {
	for (const state of ['isDisabled', 'isReadOnly', 'isLoading']) {
		const f = mount({ [state]: true }, true)
		try {
			f.input().window = f.window; f.notify(); await f.settle(); expect(f.calls).toEqual([])
			f.render({ ...f.base, [state]: false }); f.notify(); await f.settle(); expect(f.calls).toEqual([])
			f.render({ ...f.base, [state]: false, hasAutoFocus: false }); f.render({ ...f.base, [state]: false, hasAutoFocus: true }); f.notify(); await f.settle(); expect(f.calls).toEqual([f.input()])
		} finally { f.root.unmount() }
	}
})
it('changed responder or active editing wins over an outstanding autofocus request', async () => {
	for (const reason of ['responder', 'editing']) {
		const f = mount()
		try {
			await f.settle(); f.input().window = f.window; f.notify()
			const other = {}; if (reason === 'responder') f.window.firstResponder = other
			else f.render({ ...f.base, editing: { filter: { field: 'title' }, index: -1 } })
			await f.settle(); expect(f.calls).toEqual([]); if (reason === 'responder') expect(f.window.firstResponder).toBe(other)
		} finally { f.root.unmount() }
	}
})
it('stable callback handles use current blocking, preserve foreign blur and become inert on teardown', async () => {
	const f = mount({ hasAutoFocus: false }), replacement = vi.fn()
	let held: any
	try {
		f.input().window = f.window; held = f.handles[0]; held.focusTypeahead(); expect(f.window.firstResponder).toBe(f.input())
		const other = {}; f.window.firstResponder = other; held.blurTypeahead(); expect(f.window.firstResponder).toBe(other)
		f.render({ ...f.base, isDisabled: true, handleRef: replacement }); held.focusTypeahead(); expect(f.window.firstResponder).toBe(other); expect(replacement).toHaveBeenLastCalledWith(held)
	} finally { f.root.unmount() }
	const count = f.calls.length; held.focusTypeahead(); held.blurTypeahead(); await f.settle(); expect(f.calls).toHaveLength(count)
})

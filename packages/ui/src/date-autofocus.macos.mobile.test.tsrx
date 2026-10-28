/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DateInput } from './DateInput.macos.tsrx'
import { TimeInput } from './TimeInput.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
vi.mock('./Popover.macos.tsrx', () => ({ Popover: () => null }))
afterEach(() => vi.unstubAllGlobals())
function mount(Control: any, extra: any = {}, inherited = false) {
	const observers = new Map<object, any>(), monitors = new Map<object, any>(), calls: any[] = []
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, _: any, __: any, callback: any) { const token = {}; observers.set(token, { name, callback }); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('NSEvent', { addLocalMonitorForEventsMatchingMaskHandler(_: number, callback: any) { const token = {}; monitors.set(token, callback); return token }, removeMonitor(token: object) { monitors.delete(token) } })
	const window: any = { firstResponder: {}, makeFirstResponder(view: any) { calls.push(view); window.firstResponder = view; return true } }
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	function Fixture(props: any) { return inherited ? <FormField label="When" isDisabled={props.isDisabled}><Control {...props} /></FormField> : <Control {...props} /> }
	const base = { id: 'field', label: 'When', value: null, hasAutoFocus: true, onChange: vi.fn(), ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const field = () => all().find((node) => node.props?.id === 'field')
	const render = (props: any) => flushUniversalSync(() => root.render(Fixture, props))
	const notify = () => { for (const observer of [...observers.values()]) if (observer.name === 'NSWindowDidUpdateNotification') observer.callback({ object: window }); flushUniversalSync(() => {}) }
	render(base)
	return { root, base, render, field, window, calls, observers, monitors, notify }
}
for (const [name, Control] of [['DateInput', DateInput], ['TimeInput', TimeInput]] as const) {
	it(`${name} waits for attachment, honors the live autofocus flag, focuses once and cleans native observation`, async () => {
		const f = mount(Control)
		try {
			await Promise.resolve(); expect(f.calls).toEqual([])
			f.field().window = f.window; f.notify(); await vi.waitFor(() => expect(f.calls).toEqual([f.field()]))
			f.render({ ...f.base, placeholder: 'Updated' }); f.notify(); await Promise.resolve(); expect(f.calls).toHaveLength(1)
			expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.monitors.size).toBe(0)
		} finally { f.root.unmount() }
		expect(f.observers.size).toBe(0); expect(f.monitors.size).toBe(0)
	})
	it(`${name} cancels delayed requests on user input, prop removal or teardown`, async () => {
		for (const reason of ['input', 'flag', 'unmount']) {
			const f = mount(Control)
			try {
				await Promise.resolve(); const field = f.field(), callbacks = [...f.observers.values()]
				if (reason === 'input') { const event = { type: 10 }; const monitor = [...f.monitors.values()][0]; expect(monitor(event)).toBe(event) }
				if (reason === 'flag') f.render({ ...f.base, hasAutoFocus: false })
				if (reason === 'unmount') f.root.unmount()
				field.window = f.window; callbacks.forEach((observer) => observer.callback({ object: f.window })); f.notify(); await Promise.resolve(); await Promise.resolve(); expect(f.calls).toEqual([])
			} finally { f.root.unmount() }
			expect(f.observers.size).toBe(0); expect(f.monitors.size).toBe(0)
		}
	})
	it(`${name} does not rearm merely on inherited unblocking; an explicit new request uses current props`, async () => {
		const f = mount(Control, { isDisabled: true }, true)
		try {
			f.field().window = f.window; f.notify(); await Promise.resolve(); expect(f.calls).toEqual([])
			f.render({ ...f.base, isDisabled: false }); f.notify(); await Promise.resolve(); expect(f.calls).toEqual([])
			f.render({ ...f.base, isDisabled: false, hasAutoFocus: false }); f.render({ ...f.base, isDisabled: false, hasAutoFocus: true }); f.notify()
			await vi.waitFor(() => expect(f.calls).toEqual([f.field()]))
		} finally { f.root.unmount() }
	})
}

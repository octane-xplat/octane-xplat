/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DateInput } from './DateInput.macos.tsrx'
import { DateRangeInput } from './DateRangeInput.macos.tsrx'
const captured = vi.hoisted(() => ({ calendar: new Map<string, any>(), popup: new Map<string, any>() }))
vi.mock('./Calendar.macos.tsrx', () => ({ Calendar: (props: any) => { captured.calendar.set(props.mode, props); return null } }))
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => { captured.popup.set(props.className, props); return props.open ? <masonview>{props.children}</masonview> : null } }))
const cases = [['single', DateInput], ['range', DateRangeInput]] as const
const selected = (mode: string) => mode === 'single' ? '2026-03-06' : { start: '2026-03-06', end: '2026-03-08' }
function mount(mode: string, Control: any, extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const prefix = mode === 'single' ? 'vx-dateinput' : 'vx-daterangeinput'
	const flush = () => flushUniversalSync(() => {})
	const base = { id: 'when', value: mode === 'single' ? '2026-03-05' : null, onChange: vi.fn(), ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const one = (name: string) => all().find((node) => String(node.props?.className).split(' ').includes(`${prefix}-${name}`))
	const render = (next: any) => { root.render(Control, next); flush() }
	render(base)
	const toggle = one(mode === 'single' ? 'toggle' : 'trigger').props.onTap
	const popup = () => captured.popup.get(`${prefix}-popover`)
	const open = () => { toggle(); flush(); return captured.calendar.get(mode).onChange }
	return { root, base, render, one, flush, toggle, popup, open, all }
}
it.each(cases)('%s claims before callback reentry, excludes pending edits/popup entry, and releases after save settlement', async (mode, Control) => {
	let repeat = () => {}, count = 0, settle!: () => void
	const change = vi.fn(() => { if (++count === 1) repeat() }), save = vi.fn(() => new Promise<void>((done) => { settle = done }))
	const env = mount(mode, Control, { onChange: change, changeAction: save })
	try {
		const pick = env.open()
		repeat = () => { env.render({ ...env.base, label: 'Reentered' }); pick(selected(mode)) }
		pick(selected(mode)); env.flush(); pick(selected(mode)); env.toggle(); env.flush()
		expect(change).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1); expect(env.popup().open).toBe(false)
		settle(); await vi.waitFor(() => { env.flush(); expect(env.one(mode === 'single' ? 'toggle' : 'trigger').props.disabled).toBe(false) })
		env.toggle(); env.flush(); expect(env.popup().open).toBe(true)
	} finally { env.root.unmount() }
})
it.each(cases)('%s revalidates cached calendar choices against current bounds/blocking and rejects closed or detached choices', () => {
	const change = vi.fn(), env = mount(mode, Control, { onChange: change })
	try {
		const pick = env.open()
		env.render({ ...env.base, max: '2026-03-04' }); pick(selected(mode)); env.flush(); expect(change).not.toHaveBeenCalled()
		env.render({ ...env.base, dateConstraints: [() => false] }); pick(selected(mode)); env.flush(); expect(change).not.toHaveBeenCalled()
		env.render({ ...env.base, isReadOnly: true }); pick(selected(mode)); env.toggle(); env.flush()
		expect(change).not.toHaveBeenCalled(); expect(env.popup().open).toBe(false)
		env.render(env.base); pick(selected(mode)); expect(change).not.toHaveBeenCalled() // Closed picker retains no selection authority.
		env.root.unmount(); pick(selected(mode)); env.toggle(); expect(change).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
it.each(cases)('%s releases forward/save failures and dispatches an accepted save after callback teardown', async (mode, Control) => {
	const env = mount(mode, Control, { onChange: () => { throw Error('forward') } })
	try {
		const pick = env.open(); expect(() => pick(selected(mode))).toThrow('forward')
		const changed = vi.fn()
		env.render({ ...env.base, onChange: changed, changeAction: () => Promise.reject(Error('offline')) }); pick(selected(mode)); env.flush()
		await vi.waitFor(() => { env.flush(); expect(env.one(mode === 'single' ? 'toggle' : 'trigger').props.disabled).toBe(false) })
		expect(changed).toHaveBeenCalledTimes(1)
		env.render({ ...env.base, onChange: changed, changeAction: () => { throw Error('offline') } }); env.open()(selected(mode)); env.flush()
		await vi.waitFor(() => { env.flush(); expect(env.one(mode === 'single' ? 'toggle' : 'trigger').props.disabled).toBe(false) })
		let settle!: () => void
		const saved = vi.fn(() => new Promise<void>((done) => { settle = done }))
		env.render({ ...env.base, onChange: () => env.root.unmount(), changeAction: saved }); env.open()(selected(mode))
		expect(saved).toHaveBeenCalledWith(selected(mode)); settle(); await Promise.resolve(); env.flush()
	} finally { env.root.unmount() }
})
it('range preset activation resolves the current keyed preset once and rejects removed or newly invalid presets', () => {
	const changed = vi.fn(), initial = vi.fn(() => ({ start: '2026-03-06', end: '2026-03-08' }))
	const env = mount('range', DateRangeInput, { onChange: changed, presets: [{ label: 'Trip', getRange: initial }] })
	try {
		env.open(); const activate = env.all().find((node) => node.props?.id === 'when-preset-0').props.onTap
		env.render({ ...env.base, presets: [] }); initial.mockClear(); activate(); expect(initial).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled()
		const replacement = vi.fn(() => ({ start: '2026-03-10', end: '2026-03-11' }))
		env.render({ ...env.base, presets: [{ label: 'Trip', getRange: replacement }], maxRangeSpan: 1 }); replacement.mockClear()
		activate(); expect(replacement).toHaveBeenCalledTimes(1); expect(changed).not.toHaveBeenCalled()
		env.render({ ...env.base, presets: [{ label: 'Trip', getRange: replacement }] }); replacement.mockClear()
		activate(); expect(replacement).toHaveBeenCalledTimes(1); env.flush()
		expect(changed).toHaveBeenCalledWith({ start: '2026-03-10', end: '2026-03-11' }); expect(env.popup().open).toBe(false)
	} finally { env.root.unmount() }
})

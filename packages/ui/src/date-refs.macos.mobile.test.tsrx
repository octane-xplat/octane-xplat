/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DateInput } from './DateInput.macos.tsrx'
import { TimeInput } from './TimeInput.macos.tsrx'
import { DateTimeInput } from './DateTimeInput.macos.tsrx'
import { DateRangeInput } from './DateRangeInput.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
vi.mock('./Popover.macos.tsrx', () => ({ Popover: () => null }))

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const calls: unknown[] = [], window = { firstResponder: null as any, makeFirstResponder(view: any) { calls.push(view); this.firstResponder = view; return true } }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const render = (next: any) => {
		root.render(component, next); flushUniversalSync(() => {})
		for (const node of all()) { node.window = window; node.hidden = false }
	}
	render(props)
	return { root, render, all, calls, window, primary: () => all().find((node) => node.props?.id === 'field') }
}
const controls = [['DateInput', DateInput], ['TimeInput', TimeInput], ['DateTimeInput', DateTimeInput], ['DateRangeInput', DateRangeInput]] as const
it.each(controls)('%s delivers a live date-family handle, replaces ref owners, blocks focus and clears on unmount', (_name, Control) => {
	const object = { current: null as any }, callback = vi.fn(), next = { current: null as any }
	const props = { id: 'field', label: 'When', value: null, onChange: vi.fn(), ref: [object, [callback]] }
	const env = mount(Control, props)
	let held: any
	try {
		held = object.current; expect(held).toBeTruthy(); expect(held.native).toBe(env.primary()); expect(callback).toHaveBeenLastCalledWith(held)
		held.focus(); expect(env.window.firstResponder).toBe(env.primary()); held.blur(); expect(env.window.firstResponder).toBe(null)
		const primary = env.primary()
		for (const blocked of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
			env.render({ ...props, ...blocked }); const before = env.calls.length; held.focus(); expect(env.calls).toHaveLength(before)
			expect(held.native).toBe(primary)
		}
		env.render({ ...props, ref: next }); expect(object.current).toBe(null); expect(callback).toHaveBeenLastCalledWith(null)
		expect(next.current.native).toBe(primary); next.current.focus(); expect(env.window.firstResponder).toBe(primary)
	} finally { env.root.unmount() }
	expect(next.current).toBe(null); expect(held.native).toBe(null)
	const before = env.calls.length; held.focus(); held.blur(); expect(env.calls).toHaveLength(before)
})
it('DateTimeInput blur releases its current time editor while preserving unrelated responders', () => {
	const ref = { current: null as any }, env = mount(DateTimeInput, { id: 'field', value: null, onChange: vi.fn(), ref })
	try {
		const time = env.all().find((node) => node.props?.id === 'field-time'), editor = {}, other = {}
		time.currentEditor = () => editor; env.window.firstResponder = editor
		ref.current.blur(); expect(env.window.firstResponder).toBe(null)
		env.window.firstResponder = other; ref.current.blur(); expect(env.window.firstResponder).toBe(other)
		ref.current.focus(); expect(env.window.firstResponder).toBe(env.primary())
	} finally { env.root.unmount() }
})
it('an enclosing Field supplies current blocking state to date handle focus', () => {
	function Parent(props: any) {
		return <FormField label="When" isDisabled={props.isDisabled}><DateInput id="field" ref={props.fieldRef} /></FormField>
	}
	const ref = { current: null as any }, env = mount(Parent, { fieldRef: ref, isDisabled: true })
	try {
		ref.current.focus(); expect(env.calls).toHaveLength(0)
		env.render({ fieldRef: ref, isDisabled: false }); ref.current.focus(); expect(env.window.firstResponder).toBe(env.primary())
	} finally { env.root.unmount() }
})

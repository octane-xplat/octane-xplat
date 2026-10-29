/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
// State/key fixtures use an explicit inline test host; floating ownership has separate cases.
vi.mock('./TypeaheadResults.macos.tsrx', () => ({ TypeaheadResults: (props: any) => props.open ? props.children ?? null : null }))
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Tokenizer } from './Tokenizer.macos.tsrx'
vi.mock('../overlays/Tooltip.tsrx', () => ({ Tooltip: (props: any) => props.children ?? null }))
const tags = [{ id: 'a', label: 'Ada' }, { id: 'g', label: 'Grace' }]
afterEach(() => vi.useRealTimers())
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const window: any = { firstResponder: null }, removes = new Map<string, () => void>()
	const base = { searchSource: { bootstrap: () => [], search: async () => [] }, value: tags, onChange: vi.fn(), renderToken: (item: any, remove: () => void) => { removes.set(item.id, remove); return <label text={item.label} /> }, ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const input = () => all().find((node) => node.type === 'textfield')
	const wrapper = () => all().find((node) => String(node.props?.className).split(' ').includes('vx-tokenizer'))
	const flush = () => { flushUniversalSync(() => {}); for (const node of all()) { node.window = window; for (const child of node.children ?? []) child.superview = node }; if (input()) Object.defineProperty(input(), 'stringValue', { configurable: true, get() { return this.props?.value ?? '' } }) }
	const render = (props: any) => { root.render(Tokenizer, props); flush() }
	const key = (extra: any = {}) => {
		const event = { key: 'Backspace', target: input(), currentTarget: input(), defaultPrevented: false, isComposing: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation: vi.fn(), ...extra }
		input().props.onKeyDown(event); flush(); return event
	}
	render(base); window.firstResponder = input()
	return { root, base, render, flush, key, input, wrapper, window, removes }
}
it('empty Backspace requests the current tail and controlled echo selects the next current tail', () => {
	const f = mount()
	try {
		expect(f.key().defaultPrevented).toBe(true); expect(f.base.onChange).toHaveBeenLastCalledWith([tags[0]], { type: 'remove', item: tags[1] })
		expect(f.window.firstResponder).toBe(f.input())
		const current = { ...tags[0], label: 'Current Ada' }; f.render({ ...f.base, value: [current] }); f.key({ repeat: true })
		expect(f.base.onChange).toHaveBeenLastCalledWith([], { type: 'remove', item: current })
		f.render({ ...f.base, value: [] }); expect(f.key().defaultPrevented).toBe(false)
	} finally { f.root.unmount() }
})
it('query and native editor text preserve ordinary deletion independently', () => {
	const f = mount()
	try {
		f.input().props.onTextChange('draft'); f.flush(); expect(f.key().defaultPrevented).toBe(false)
		f.input().props.onTextChange(''); f.flush()
		const editor = { string: 'native draft', hasMarkedText: false }; f.input().currentEditor = () => editor; f.window.firstResponder = editor
		expect(f.key().defaultPrevented).toBe(false); editor.string = ''; expect(f.key().defaultPrevented).toBe(true)
		expect(f.base.onChange).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('composing, marked editors and every modifier retain native editing', () => {
	const f = mount()
	try {
		for (const extra of [{ isComposing: true }, { keyCode: 229 }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(f.key(extra).defaultPrevented).toBe(false)
		const editor: any = { string: '', hasMarkedText: true }; f.input().currentEditor = () => editor; f.window.firstResponder = editor
		expect(f.key().defaultPrevented).toBe(false); editor.hasMarkedText = () => true; expect(f.key().defaultPrevented).toBe(false)
		expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('held token callbacks use current identity and reject removed or currently blocked selections', () => {
	const f = mount(), remove = f.removes.get('g')!
	try {
		const current = { ...tags[1], label: 'Current Grace' }; f.render({ ...f.base, value: [current, tags[0]] }); remove()
		expect(f.base.onChange).toHaveBeenLastCalledWith([tags[0]], { type: 'remove', item: current })
		for (const props of [{ value: [tags[0]] }, { isReadOnly: true }, { isDisabled: true }]) { f.render({ ...f.base, ...props }); remove(); f.key() }
		expect(f.base.onChange).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('callback reentry is rejected and focus chosen by the callback survives pointer removal', () => {
	const f = mount(), other = {}, remove = f.removes.get('g')!, notify = vi.fn(() => { remove(); f.window.firstResponder = other })
	try {
		f.render({ ...f.base, onChange: notify }); remove(); f.flush()
		expect(notify).toHaveBeenCalledTimes(1); expect(f.window.firstResponder).toBe(other)
		f.root.unmount(); remove(); expect(notify).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('one public live handle clears the previous ref and becomes inert after teardown', () => {
	const first = vi.fn(), second = vi.fn(), f = mount({ ref: first })
	try {
		const handle = first.mock.calls.find(([value]) => value)?.[0]; expect(first).toHaveBeenCalledTimes(1); expect(handle.native).toBe(f.wrapper())
		f.render({ ...f.base, ref: second }); expect(first).toHaveBeenLastCalledWith(null); expect(second).toHaveBeenLastCalledWith(handle)
		f.root.unmount(); expect(handle.native).toBe(null); expect(() => { handle.focus(); handle.blur() }).not.toThrow()
	} finally { f.root.unmount() }
})
it('delayed blur retains embedded focus, then uses the latest callback and cancels on teardown', () => {
	vi.useFakeTimers(); const f = mount(), blur = vi.fn(), retired = vi.fn()
	try {
		f.render({ ...f.base, onBlur: retired }); f.input().props.onFocus(); f.flush()
		const child = { superview: f.wrapper() }; f.window.firstResponder = child; f.wrapper().props.onBlur(); vi.advanceTimersByTime(50); f.flush(); expect(retired).not.toHaveBeenCalled()
		f.window.firstResponder = {}; f.wrapper().props.onBlur(); f.render({ ...f.base, onBlur: blur }); vi.advanceTimersByTime(50); f.flush(); expect(blur).toHaveBeenCalledTimes(1); expect(retired).not.toHaveBeenCalled()
		f.wrapper().props.onBlur(); f.root.unmount(); vi.advanceTimersByTime(50); expect(blur).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})

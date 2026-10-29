/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
// State/key fixtures use an explicit inline test host; floating ownership has separate cases.
vi.mock('./TypeaheadResults.macos.tsrx', () => ({ TypeaheadResults: (props: any) => props.open ? props.children ?? null : null }))
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
const items = [{ id: 'a', label: 'Ada' }, { id: 'g', label: 'Grace' }, { id: 'l', label: 'Alan' }]
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript')), revealed: any[] = []
	const window: any = { firstResponder: null }, source = { bootstrap: vi.fn(() => items), search: vi.fn(async () => items) }
	const base = { searchSource: source, value: null, onChange: vi.fn(), onFocus: vi.fn(), hasEntriesOnFocus: true, debounceMs: 0, ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const input = () => all().find((node) => node.type === 'textfield'), rows = () => all().filter((node) => has(node, 'vx-typeahead-option'))
	const flush = () => { flushUniversalSync(() => {}); for (const node of all()) node.window = window; for (const row of rows()) { row.bounds = {}; row.scrollRectToVisible = () => revealed.push(row) } }
	const render = (props: any) => { root.render(BaseTypeahead, props); flush() }
	const key = (key: string, extra: any = {}) => {
		const event = { key, target: input(), currentTarget: input(), code: '', defaultPrevented: false, stopped: false, isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		input().props.onKeyDown(event); flush(); return event
	}
	const focus = () => { window.firstResponder = input(); input().props.onFocus(); flush() }
	render(base); window.firstResponder = input()
	return { root, base, source, window, render, flush, key, focus, input, rows, revealed, highlighted: () => rows().findIndex((node) => has(node, 'vx-typeahead-option--highlighted')) }
}
it('actual AppKit view keys highlight/reveal current results and Enter commits without moving input focus', () => {
	const f = mount()
	try {
		f.focus(); expect(f.highlighted()).toBe(0); f.key('ArrowDown'); expect(f.highlighted()).toBe(1); expect(f.revealed).toContain(f.rows()[1])
		f.key('End'); expect(f.highlighted()).toBe(2); const enter = f.key('Enter'); expect(enter.defaultPrevented).toBe(true); expect(f.base.onChange).toHaveBeenCalledWith(items[2]); expect(f.rows()).toHaveLength(0); expect(f.window.firstResponder).toBe(f.input())
	} finally { f.root.unmount() }
})
it('closed ArrowDown offers bootstrap without synthesizing a consumer focus callback; native Tab/Escape ownership remains', () => {
	const f = mount()
	try {
		expect(f.key('ArrowDown').defaultPrevented).toBe(true); expect(f.rows()).toHaveLength(3); expect(f.base.onFocus).not.toHaveBeenCalled()
		const tab = f.key('Tab', { shiftKey: true }); expect(tab.defaultPrevented).toBe(false); expect(tab.stopped).toBe(false); expect(f.rows()).toHaveLength(0)
		f.key('ArrowDown'); expect(f.key('Escape').defaultPrevented).toBe(true); expect(f.key('Escape').defaultPrevented).toBe(false)
	} finally { f.root.unmount() }
})
it('consumer preventDefault and current readonly/foreign responder state suppress internal selection', () => {
	const notify = vi.fn((event) => event.preventDefault()), f = mount({ onKeyDown: notify })
	try {
		f.focus(); f.key('ArrowDown'); expect(notify).toHaveBeenCalledTimes(1); expect(f.highlighted()).toBe(0)
		f.render({ ...f.base, onKeyDown: undefined, isReadOnly: true }); expect(f.key('Enter').defaultPrevented).toBe(false); expect(f.base.onChange).not.toHaveBeenCalled()
		f.render({ ...f.base, onKeyDown: undefined }); f.focus(); f.window.firstResponder = {}; f.key('Enter'); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('IME/marked field-editor ownership and modified editing stay native; unmodified current editor navigation works', () => {
	const f = mount()
	try {
		f.focus(); const editor = { hasMarkedText: true }; f.input().currentEditor = () => editor; f.window.firstResponder = editor
		expect(f.key('Enter').defaultPrevented).toBe(false); editor.hasMarkedText = false
		for (const extra of [{ isComposing: true }, { metaKey: true }, { altKey: true }, { ctrlKey: true }, { shiftKey: true }]) expect(f.key('ArrowDown', extra).defaultPrevented).toBe(false)
		f.key('ArrowUp'); expect(f.highlighted()).toBe(2); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('consumer prop replacement/unmount cannot select a retired result, and current keyed results remain authoritative', () => {
	const f = mount(), replacement = { id: 'new', label: 'Current person' }, source = { bootstrap: vi.fn(() => [replacement]), search: vi.fn(async () => []) }
	try {
		f.focus(); f.render({ ...f.base, onKeyDown: () => { f.render({ ...f.base, searchSource: source }); f.focus() } }); f.key('Enter'); expect(f.base.onChange).toHaveBeenCalledWith(replacement)
		f.render({ ...f.base, onKeyDown: () => f.root.unmount() }); f.focus(); f.key('Enter'); expect(f.base.onChange).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})

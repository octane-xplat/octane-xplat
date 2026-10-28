/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
afterEach(() => vi.unstubAllGlobals())
const people = [{ id: 'a', label: 'Ada' }, { id: 'g', label: 'Grace' }]
function mount(attached = true) {
	const observers = new Map<object, any>()
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, _: unknown, __: unknown, callback: any) { const token = {}; observers.set(token, { name, callback }); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('NSAccessibilityPostNotification', vi.fn())
	const window: any = { firstResponder: null }, container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const base = { searchSource: { bootstrap: () => people, search: async () => people }, value: null, onChange: vi.fn(), hasEntriesOnFocus: true, debounceMs: 0, accessibilityLabel: 'People' }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const input = () => all().find((node) => node.type === 'textfield'), list = () => all().find((node) => has(node, 'vx-typeahead-list')), rows = () => all().filter((node) => has(node, 'vx-typeahead-option'))
	const flush = () => { flushUniversalSync(() => {}); for (const node of all()) { node.window = attached ? window : null; for (const child of node.children ?? []) child.superview = node; node.isDescendantOf = (owner: any) => { for (let view = node.superview; view; view = view.superview) if (view === owner) return true; return false }; node.scrollRectToVisible = vi.fn() } }
	const render = (props: any) => { flushUniversalSync(() => root.render(BaseTypeahead, props)); flush() }
	const settle = async () => { for (let step = 0; step < 3; step++) { await Promise.resolve(); flush() } }
	const focus = () => { window.firstResponder = input(); input().props.onFocus(); flush() }
	const key = (key: string) => { const event = { key, target: input(), currentTarget: input(), defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, stopPropagation: vi.fn() }; input().props.onKeyDown(event); flush(); return event }
	const attach = () => { attached = true; flush(); for (const observer of [...observers.values()]) if (observer.name === 'NSWindowDidUpdateNotification') observer.callback({ object: window }) }
	render(base)
	return { root, base, render, settle, focus, key, attach, input, list, rows, window, observers }
}
it('the actual view exposes combo/list/option roles, names, expanded state and pending highlighted selection', async () => {
	const f = mount()
	try {
		expect(f.input().props.accessibilityRole).toBe('combobox'); expect(f.input().props.accessibilityState.expanded).toBe(false)
		f.focus(); await f.settle(); expect(f.input().props.accessibilityState.expanded).toBe(true); expect(f.list().props.accessibilityRole).toBe('listbox'); expect(f.list().props.accessibilityLabel).toBe('People')
		expect(f.rows().map((row) => row.props.accessibilityLabel)).toEqual(['Ada', 'Grace']); expect(f.rows()[0].props.accessibilityRole).toBe('option'); expect(f.rows()[0].props.accessibilityState.selected).toBe(true)
		expect(f.input().accessibilityLinkedUIElements).toEqual([f.list()]); expect(f.list().accessibilitySelectedChildren).toEqual([f.rows()[0]]); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('native pending selection follows keys while physical input focus and controlled commit ownership stay distinct', async () => {
	const f = mount()
	try {
		f.focus(); await f.settle(); f.key('ArrowDown'); await f.settle(); expect(f.list().accessibilitySelectedChildren).toEqual([f.rows()[1]]); expect(f.input().accessibilitySelectedChildren).toEqual([f.rows()[1]]); expect(f.window.firstResponder).toBe(f.input()); expect(f.base.onChange).not.toHaveBeenCalled()
		f.key('Enter'); await f.settle(); expect(f.base.onChange).toHaveBeenCalledExactlyOnceWith(people[1]); expect(f.list()).toBeUndefined(); expect(f.input().accessibilityLinkedUIElements).toEqual([]); expect(f.input().props.accessibilityState.expanded).toBe(false)
	} finally { f.root.unmount() }
})
it('replacement/empty results release retired row links and reflect current keyed results', async () => {
	const f = mount(), item = { id: 'new', label: 'Current person' }
	try {
		f.focus(); await f.settle(); const retired = f.rows()[0]
		f.render({ ...f.base, searchSource: { bootstrap: () => [item], search: async () => [item] } }); f.focus(); await f.settle(); expect(f.input().accessibilitySelectedChildren).toEqual([f.rows()[0]]); expect(f.rows()[0]).not.toBe(retired); expect(f.rows()[0].props.accessibilityLabel).toBe('Current person')
		f.render({ ...f.base, searchSource: { bootstrap: () => [], search: async () => [] } }); f.input().props.onTextChange('missing'); await f.settle(); expect(f.input().accessibilitySelectedChildren).toEqual([]); expect(f.list().accessibilitySelectedChildren).toEqual([])
	} finally { f.root.unmount() }
})
it('current readonly/disabled state collapses exposed links and retired option actions cannot commit', async () => {
	for (const state of [{ isReadOnly: true }, { isDisabled: true }]) {
		const f = mount()
		try {
			f.focus(); await f.settle(); const press = f.rows()[0].props.onTap; f.render({ ...f.base, ...state }); await f.settle(); press(); expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.input().props.accessibilityState.expanded).toBe(false); expect(f.input().accessibilityLinkedUIElements).toEqual([])
		} finally { f.root.unmount() }
	}
})
it('late attachment binds the current native owners and teardown retires held observers/queued work', async () => {
	const f = mount(false)
	try {
		f.focus(); await f.settle(); expect(f.input().accessibilityLinkedUIElements).toBeUndefined(); expect(f.observers.size).toBeGreaterThan(0)
		f.attach(); await f.settle(); const input = f.input(); expect(input.accessibilitySelectedChildren).toEqual([f.rows()[0]]); const callbacks = [...f.observers.values()]
		f.root.unmount(); callbacks.forEach((observer) => observer.callback({ object: f.window })); await f.settle(); expect(input.accessibilityLinkedUIElements).toEqual([]); expect(input.accessibilitySelectedChildren).toEqual([]); expect(f.observers.size).toBe(0)
	} finally { f.root.unmount() }
})

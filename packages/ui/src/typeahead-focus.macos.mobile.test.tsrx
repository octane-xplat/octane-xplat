/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
import { Typeahead } from './Typeahead.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
const ada = { id: 'ada', label: 'Ada' }, grace = { id: 'grace', label: 'Grace' }
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
function mount(extra: any = {}, inherited = false, Control: any = BaseTypeahead) {
	const ref = { current: null as any }, calls: any[] = [], observers = new Map<object, any>(), monitors = new Map<object, any>()
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, _: any, __: any, callback: any) { const token = {}; observers.set(token, { name, callback }); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('NSEvent', { addLocalMonitorForEventsMatchingMaskHandler(_: number, callback: any) { const token = {}; monitors.set(token, callback); return token }, removeMonitor(token: object) { monitors.delete(token) } })
	const window: any = { firstResponder: {}, makeFirstResponder(view: any) { calls.push(view); window.firstResponder = view; return true } }
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const source = { bootstrap: vi.fn(() => [ada, grace]), search: vi.fn(async (_text: string, _options?: any) => [ada, grace]) }
	const base = { id: 'search', label: 'Person', ref, searchSource: source, value: null, onChange: vi.fn(), onChangeQuery: vi.fn(), onOpenChange: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), debounceMs: 0, ...extra }
	function Fixture(props: any) { return inherited ? <FormField label="Assignee" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}><Control {...props} isDisabled={undefined} isReadOnly={undefined} /></FormField> : <Control {...props} /> }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const input = () => all().find((node) => node.type === 'textfield')
	const shell = () => all().find((node) => has(node, 'vx-typeahead') && node.props.onBlur)
	const options = () => all().filter((node) => has(node, 'vx-typeahead-option'))
	const flush = () => flushUniversalSync(() => {})
	const render = (props: any) => { flushUniversalSync(() => root.render(Fixture, props)); for (const node of all()) node.window = window }
	const settle = async () => { await Promise.resolve(); flush(); await Promise.resolve(); flush() }
	const notify = () => { for (const observer of [...observers.values()]) if (observer.name === 'NSWindowDidUpdateNotification') observer.callback({ object: window }) }
	render(base)
	return { root, all, base, source, ref, calls, window, observers, monitors, input, shell, options, flush, render, settle, notify }
}
it('focus bootstraps current entries; whole-field blur closes and refocus can bootstrap again', async () => {
	const f = mount({ hasEntriesOnFocus: true })
	try {
		f.input().props.onFocus(); await f.settle(); expect(f.source.bootstrap).toHaveBeenCalledTimes(1); expect(f.options()).toHaveLength(2); expect(f.base.onFocus).toHaveBeenCalledTimes(1)
		const host = f.input(); f.render({ ...f.base, placeholder: 'Current label' }); expect(f.input()).toBe(host); expect(f.options()).toHaveLength(2)
		f.shell().props.onBlur({}); await f.settle(); expect(f.options()).toHaveLength(0); expect(f.base.onBlur).toHaveBeenCalledTimes(1)
		f.input().props.onFocus(); await f.settle(); expect(f.source.bootstrap).toHaveBeenCalledTimes(2); expect(f.options()).toHaveLength(2); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('native text uses the string adapter, searches, and commits current results with original callback ordering', async () => {
	const events: string[] = [], f = mount({ onChange: vi.fn(() => events.push('change')), onOpenChange: vi.fn((open) => events.push(String(open))) })
	try {
		f.input().props.onTextChange('Ada'); await f.settle(); expect(f.source.search.mock.calls[0][0]).toBe('Ada'); expect(f.base.onChangeQuery).toHaveBeenCalledWith('Ada')
		f.options()[0].props.onTap(); await f.settle(); expect(f.base.onChange).toHaveBeenCalledWith(ada); expect(events).toEqual(['true', 'change', 'false']); expect(f.input().props.value).toBe('')
	} finally { f.root.unmount() }
})
it('the public handle reads live hosts, guards owned blur and remains inert after teardown', async () => {
	const f = mount(), next = { current: null as any }; let held: any
	try {
		held = f.ref.current; expect(held.native).toBe(f.input()); held.focus(); expect(f.window.firstResponder).toBe(f.input())
		const other = {}, editor = {}; f.window.firstResponder = other; held.blur(); expect(f.window.firstResponder).toBe(other)
		f.input().currentEditor = () => editor; f.window.firstResponder = editor; held.blur(); expect(f.window.firstResponder).toBe(null)
		f.render({ ...f.base, ref: next }); expect(f.ref.current).toBe(null); expect(next.current.native).toBe(f.input())
		const changeQuery = vi.fn(); f.render({ ...f.base, ref: next, onChangeQuery: changeQuery }); next.current.setQuery('Grace'); await f.settle(); expect(changeQuery).toHaveBeenCalledWith('Grace')
	} finally { f.root.unmount() }
	expect(held.native).toBe(null); const calls = f.calls.length; held.focus(); held.blur(); held.setQuery('retired'); expect(f.calls.length).toBe(calls); expect(next.current).toBe(null)
})
it('live disabled/read-only state blocks retained edit/selection callbacks and reaches native enabled/editable props', async () => {
	for (const state of [{ isDisabled: true }, { isReadOnly: true }] as Record<string, boolean>[]) {
		const f = mount({ hasEntriesOnFocus: true }, true)
		try {
			f.input().props.onFocus(); await f.settle(); const row = f.options()[0].props.onTap, edit = f.input().props.onTextChange
			f.render({ ...f.base, ...state }); edit('Ada'); row(); await f.settle(); expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.base.onChangeQuery).not.toHaveBeenCalled()
			expect(f.input().props.editable).toBe(false); expect(f.input().props.isEnabled).toBe(!state.isDisabled)
		} finally { f.root.unmount() }
	}
})
it('a focusable disabled reason preserves focus discovery while blocking bootstrap and edits', async () => {
	const f = mount({ isDisabled: true, isFocusableDisabled: true, hasEntriesOnFocus: true })
	try {
		expect(f.input().props.isEnabled).toBe(true); expect(f.input().props.editable).toBe(false); f.ref.current.focus(); expect(f.window.firstResponder).toBe(f.input())
		f.input().props.onFocus(); f.input().props.onTextChange('Ada'); await f.settle(); expect(f.source.bootstrap).not.toHaveBeenCalled(); expect(f.source.search).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('a superseding query retires old results immediately, before its debounce starts', async () => {
	let finish!: (items: any[]) => void
	const source = { bootstrap: vi.fn(() => []), search: vi.fn(() => new Promise<any[]>((resolve) => { finish = resolve })) }, f = mount({ searchSource: source })
	try {
		f.input().props.onTextChange('old'); f.flush(); vi.useFakeTimers(); f.render({ ...f.base, debounceMs: 100 }); f.input().props.onTextChange('new'); f.flush()
		finish([ada]); await f.settle(); expect(f.options()).toHaveLength(0); expect(source.search).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(100); expect(source.search).toHaveBeenCalledTimes(2); finish([grace]); await f.settle(); expect(f.options()).toHaveLength(1)
	} finally { f.root.unmount() }
})
it('source replacement cancels queued work without replaying an old query against the new source', async () => {
	vi.useFakeTimers(); const f = mount({ debounceMs: 100 }), source = { bootstrap: vi.fn(() => []), search: vi.fn(async () => [grace]) }
	try {
		f.input().props.onTextChange('old'); f.render({ ...f.base, searchSource: source }); await vi.advanceTimersByTimeAsync(100); expect(f.source.search).not.toHaveBeenCalled(); expect(source.search).not.toHaveBeenCalled()
		f.input().props.onTextChange('new'); await vi.advanceTimersByTimeAsync(100); await f.settle(); expect(source.search).toHaveBeenCalledWith('new', expect.objectContaining({ signal: expect.any(AbortSignal) }))
	} finally { f.root.unmount() }
})
it('late bootstrap results cannot reopen after field-leave blur even when the source ignores abort', async () => {
	let finish!: (items: any[]) => void, signal!: AbortSignal
	const source = { bootstrap: vi.fn((options: any) => { signal = options.signal; return new Promise<any[]>((resolve) => { finish = resolve }) }), search: vi.fn(async () => []) }
	const f = mount({ searchSource: source, hasEntriesOnFocus: true })
	try {
		f.input().props.onFocus(); f.flush(); f.shell().props.onBlur({}); expect(signal.aborted).toBe(true); finish([ada]); await f.settle(); expect(f.options()).toHaveLength(0); expect(f.base.onOpenChange).not.toHaveBeenCalledWith(true)
	} finally { f.root.unmount() }
})
it('retained option callbacks resolve a current matching key and reject duplicate/reentrant selection', async () => {
	const f = mount({ hasEntriesOnFocus: true }); let old: () => void
	try {
		f.input().props.onFocus(); await f.settle(); old = f.options()[0].props.onTap
		const replacement = { ...ada, label: 'Current Ada' }, source = { bootstrap: vi.fn(() => [replacement]), search: vi.fn(async () => []) }
		const change = vi.fn(() => old()); f.render({ ...f.base, searchSource: source, onChange: change }); f.input().props.onFocus(); await f.settle(); old(); await f.settle()
		expect(change).toHaveBeenCalledTimes(1); expect(change).toHaveBeenCalledWith(replacement)
	} finally { f.root.unmount() }
})
it('query callback teardown retires debounce and held handlers; selection teardown does not notify a detached layer', async () => {
	vi.useFakeTimers(); const f = mount({ debounceMs: 100 }); const query = vi.fn(() => f.root.unmount())
	f.render({ ...f.base, onChangeQuery: query }); f.input().props.onTextChange('Ada'); await vi.advanceTimersByTimeAsync(100); expect(f.source.search).not.toHaveBeenCalled()
	const g = mount({ hasEntriesOnFocus: true }); g.input().props.onFocus(); await g.settle(); const row = g.options()[0].props.onTap, change = vi.fn(() => g.root.unmount())
	g.render({ ...g.base, onChange: change }); row(); await g.settle(); expect(change).toHaveBeenCalledTimes(1); expect(g.base.onOpenChange.mock.calls).toEqual([[true]])
})
it('autofocus composes the queued AppKit request owner and releases pending native observation', async () => {
	const f = mount({ hasAutoFocus: true })
	try { f.notify(); await f.settle(); expect(f.calls).toEqual([f.input()]); expect(f.monitors.size).toBe(0) }
	finally { f.root.unmount() }
	expect(f.observers.size).toBe(0)
})

it('Typeahead click-to-edit reports its query once and readonly state removes clear/edit actions', async () => {
	const f = mount({ value: ada }, false, Typeahead)
	try {
		const wrapper = f.all().find((node) => String(node.props?.className).split(' ').includes('vx-typeahead') && node.props.onTap)
		wrapper.props.onTap(); await f.settle(); expect(f.base.onChangeQuery).toHaveBeenCalledTimes(1); expect(f.base.onChangeQuery).toHaveBeenCalledWith('Ada')
		f.render({ ...f.base, isReadOnly: true }); const clear = f.all().find((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))
		expect(clear).toBeUndefined(); const current = f.all().find((node) => String(node.props?.className).split(' ').includes('vx-typeahead') && node.props.onTap)
		current.props.onTap(); await f.settle(); expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.base.onChangeQuery).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
	const inherited = mount({ value: ada, isReadOnly: true }, true, Typeahead)
	try {
		expect(inherited.all().some((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))).toBe(false)
		const wrapper = inherited.all().find((node) => String(node.props?.className).split(' ').includes('vx-typeahead') && node.props.onTap)
		wrapper.props.onTap(); await inherited.settle(); expect(inherited.base.onChangeQuery).not.toHaveBeenCalled(); expect(inherited.base.onChange).not.toHaveBeenCalled()
	} finally { inherited.root.unmount() }
})

it('current search rejection clears progress; rejected retired work cannot clear newer results', async () => {
	const pending: { reject(error: unknown): void; resolve(items: any[]): void }[] = []
	const source = { bootstrap: vi.fn(() => []), search: vi.fn(() => new Promise<any[]>((resolve, reject) => pending.push({ resolve, reject }))) }
	const f = mount({ searchSource: source })
	try {
		f.input().props.onTextChange('old'); f.flush(); f.input().props.onTextChange('current'); f.flush()
		pending[1].resolve([grace]); await f.settle(); expect(f.options()).toHaveLength(1)
		pending[0].reject(Error('retired')); await f.settle(); expect(f.options()).toHaveLength(1)
		f.input().props.onTextChange('failed'); f.flush(); pending[2].reject(Error('current')); await f.settle()
		expect(f.options()).toHaveLength(0); expect(f.all().some((node) => String(node.props?.className).split(' ').includes('vx-typeahead-loading'))).toBe(false)
	} finally { f.root.unmount() }
})

it('an explicit query from the focus callback owns the request instead of being replaced by implicit bootstrap', async () => {
	const f = mount({ hasEntriesOnFocus: true })
	try {
		f.render({ ...f.base, onFocus: () => f.ref.current.setQuery('Grace') }); f.input().props.onFocus(); await f.settle()
		expect(f.source.bootstrap).not.toHaveBeenCalled(); expect(f.source.search).toHaveBeenCalledTimes(1); expect(f.source.search.mock.calls[0][0]).toBe('Grace')
	} finally { f.root.unmount() }
})

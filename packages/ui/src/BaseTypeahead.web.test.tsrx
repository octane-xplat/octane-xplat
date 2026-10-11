// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { BaseTypeahead } from './BaseTypeahead.web.tsrx'
import { BusyLaneProvider, createBusyIndicatorLane } from './busy-lane'
import type { BaseTypeaheadProps, SearchableItem, SearchSource } from './props'

const items: SearchableItem[] = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'apricot', label: 'Apricot' },
	{ id: 'banana', label: 'Banana' },
]

const cleanups: (() => void)[] = []
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals() })

const deferred = <T,>() => {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
	return { promise, resolve, reject }
}

function makeSource(overrides: Partial<SearchSource> = {}) {
	return {
		search: vi.fn(async (query: string) => items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))),
		bootstrap: vi.fn(async () => items),
		cancel: vi.fn(),
		...overrides,
	}
}

function mount(props: Partial<BaseTypeaheadProps> = {}, node?: any) {
	vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const baseProps = {
		searchSource: makeSource(),
		value: null,
		onChange: vi.fn(),
		debounceMs: 0,
		...props,
	}

	act(() => root.render(node ?? <BaseTypeahead {...baseProps} />))
	const unmount = () => { root.unmount(); host.remove() }
	cleanups.push(unmount)
	const input = () => host.querySelector('.vx-typeahead-input') as HTMLInputElement
	const type = (value: string) => act(() => { input().value = value; input().dispatchEvent(new Event('input', { bubbles: true })) })
	const key = (key: string, init: KeyboardEventInit = {}) => act(() => {
		input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
	})

	const click = (target: Element) => act(() => (target as HTMLElement).click())
	const options = () => document.querySelectorAll('[role="option"]')
	// One microtask turn settles the deferred search pipeline inside act.
	const settle = () => act(async () => { await Promise.resolve() })
	return { host, input, type, key, click, options, settle, unmount, props: baseProps }
}

describe('BaseTypeahead search coordination', () => {
	it('searches on edit and lists the resolved results', async () => {
		const onOpenChange = vi.fn()
		const ui = mount({ onOpenChange })
		ui.type('ap')
		await ui.settle()
		expect(ui.props.searchSource.search).toHaveBeenCalledWith('ap')
		expect(ui.options()).toHaveLength(2)
		expect(document.querySelector('.vx-typeahead-empty')).toBeNull()
		expect(ui.input().getAttribute('aria-expanded')).toBe('true')
		expect(onOpenChange).toHaveBeenLastCalledWith(true)
	})

	it('reports the empty state after a completed empty search', async () => {
		const ui = mount()
		ui.type('zzz')
		await ui.settle()
		expect(document.querySelector('.vx-typeahead-empty')?.textContent).toBe('No results found')
	})

	it('keeps queries below minQueryLength from searching or reporting empty', async () => {
		const ui = mount({ minQueryLength: 3 })
		ui.type('ap')
		await ui.settle()
		expect(ui.props.searchSource.search).not.toHaveBeenCalled()
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(document.querySelector('.vx-typeahead-empty')).toBeNull()
	})

	it('bootstraps on focus when hasEntriesOnFocus is set', async () => {
		const ui = mount({ hasEntriesOnFocus: true })
		act(() => ui.input().focus())
		await ui.settle()
		expect(ui.props.searchSource.bootstrap).toHaveBeenCalledTimes(1)
		expect(ui.options()).toHaveLength(3)
	})

	it('commits a selection, resets the field, and closes', async () => {
		const order: string[] = []
		const onChange = vi.fn(() => order.push('change'))
		const onOpenChange = vi.fn((open: boolean) => order.push(open ? 'open' : 'close'))
		const ui = mount({ onChange, onOpenChange })
		ui.type('ap')
		await ui.settle()
		ui.click(ui.options()[0])
		expect(onChange).toHaveBeenCalledWith(items[0])
		expect(ui.input().value).toBe('')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(order).toEqual(['open', 'change', 'close'])
	})

	it('selects the keyboard-highlighted row with Enter', async () => {
		const onChange = vi.fn()
		const ui = mount({ onChange })
		ui.type('ap')
		await ui.settle()
		ui.key('ArrowDown')
		ui.key('Enter')
		expect(onChange).toHaveBeenCalledWith(items[1])
	})

	it('closes on Escape and reports it through onOpenChange', async () => {
		const onOpenChange = vi.fn()
		const ui = mount({ onOpenChange })
		ui.type('ap')
		await ui.settle()
		ui.key('Escape')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
	})

	it('closes when focus leaves the field for outside it', async () => {
		const onOpenChange = vi.fn()
		const ui = mount({ onOpenChange })
		ui.type('ap')
		await ui.settle()
		const outside = document.createElement('button')
		document.body.append(outside)
		act(() => { ui.input().focus(); outside.focus() })
		expect(document.querySelector('[role="listbox"]')).toBeNull()
		expect(onOpenChange).toHaveBeenLastCalledWith(false)
		outside.remove()
	})

	it('discards a stale resolution superseded by a newer query', async () => {
		const stale = deferred<SearchableItem[]>()
		const search = vi.fn((query: string) => query === 'a' ? stale.promise : Promise.resolve([items[2]]))
		const ui = mount({ searchSource: makeSource({ search }) })
		ui.type('a')
		ui.type('ab')
		await ui.settle()
		expect(ui.options()).toHaveLength(1)
		act(() => { stale.resolve([items[0]]) })
		await ui.settle()
		expect(ui.options()).toHaveLength(1)
		expect(ui.options()[0].textContent).toContain('Banana')
	})

	it('clears results and highlight on a rejected search', async () => {
		const failing = deferred<SearchableItem[]>()
		const ui = mount({ searchSource: makeSource({ search: () => failing.promise }) })
		ui.type('ap')
		await ui.settle()
		expect(ui.host.querySelector('.vx-typeahead-loading')).not.toBeNull()
		await act(async () => { failing.reject(new Error('offline')); await failing.promise.catch(() => {}) })
		expect(ui.options()).toHaveLength(0)
		expect(ui.host.querySelector('.vx-typeahead-loading')).toBeNull()
	})

	it('cancels the source on select, dismiss, and unmount', async () => {
		const ui = mount()
		ui.type('ap')
		await ui.settle()
		ui.click(ui.options()[0])
		expect(ui.props.searchSource.cancel).toHaveBeenCalled()

		ui.type('ap')
		await ui.settle()
		const calls = (ui.props.searchSource.cancel as any).mock.calls.length
		ui.key('Escape')
		expect((ui.props.searchSource.cancel as any).mock.calls.length).toBeGreaterThan(calls)

		const again = (ui.props.searchSource.cancel as any).mock.calls.length
		ui.unmount()
		expect((ui.props.searchSource.cancel as any).mock.calls.length).toBeGreaterThan(again)
	})

	it('ignores a resolution that lands after unmount', async () => {
		const pending = deferred<SearchableItem[]>()
		const search = vi.fn(() => pending.promise)
		const ui = mount({ searchSource: makeSource({ search }) })
		ui.type('ap')
		ui.unmount()
		await act(async () => { pending.resolve([items[0]]); await pending.promise })
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

	it('reports search progress through the BusyLane context', async () => {
		const lane = createBusyIndicatorLane()
		const pending = deferred<SearchableItem[]>()
		const baseProps = { searchSource: makeSource({ search: () => pending.promise }), value: null, onChange: vi.fn(), debounceMs: 0 }
		const ui = mount({}, (
			<BusyLaneProvider value={lane}>
				<BaseTypeahead {...baseProps} />
			</BusyLaneProvider>
		))

		ui.type('ap')
		expect(lane.getIsBusy()).toBe(true)
		await act(async () => { pending.resolve([items[0]]); await pending.promise })
		expect(lane.getIsBusy()).toBe(false)
	})

	it('exposes the imperative input handle through ref', async () => {
		const ref = { current: null as any }
		const ui = mount({ ref })
		expect(typeof ref.current.focus).toBe('function')
		expect(ref.current.native).toBe(ui.input())
		ui.input().focus()
		expect(document.activeElement).toBe(ui.input())
		ref.current.blur()
		expect(document.activeElement).not.toBe(ui.input())
		ref.current.setQuery('ban')
		await ui.settle()
		expect(ui.input().value).toBe('ban')
		expect(ui.props.searchSource.search).toHaveBeenCalledWith('ban')
	})
})

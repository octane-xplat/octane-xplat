/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createContext, useContext } from 'octane'
import { createObjectContainer, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { createPortalObjectDriver } from '../../../tests/portal-object-driver'
import { BaseTypeaheadView } from './BaseTypeaheadView.macos.tsrx'

// Unlike state/key fixtures, these cases mount the actual source portal. The
// recording object host flattens physical targets; it cannot prove AppKit layout.
const Person = createContext('missing'), PersonProvider: any = Person
function PersonLabel() { return <label className="provider-value" text={useContext(Person)} /> }
afterEach(() => vi.unstubAllGlobals())
function fixture() {
	const observers = new Map<object, any>(), layers: any[] = []
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: unknown, __: unknown, ___: unknown, callback: any) { const token = {}; observers.set(token, callback); return token },
		removeObserver(token: object) { observers.delete(token) },
	} })
	const viewport = { origin: { x: 0, y: 0 }, size: { width: 500, height: 300 } }
	const window: any = { contentView: { bounds: viewport, flipped: true }, firstResponder: null }
	const bounds = { origin: { x: 20, y: 40 }, size: { width: 180, height: 28 } }
	vi.stubGlobal('__xplatAppKit', { showLayer(options: any) {
		const target = { window }, source = options.createContentRoot(target)
		const layer = { source, target, options, closed: false, show: vi.fn(), close: vi.fn(() => { if (layer.closed) return; layer.closed = true; source.unmount() }), update: vi.fn(() => source.whenCommitted(() => {})) }
		layers.push(layer); layer.update(); return layer
	} })
	const inputRef = { current: null as any }, anchor = { current: null as any }
	const base: any = { inputRef, anchor, query: '', results: [{ id: 'a', label: 'Ada' }], open: true, highlightedIndex: 0,
		isSearching: false, hasSearched: true, value: null, emptyText: 'No results', size: 'medium',
		onQueryChange: vi.fn(), onSelect: vi.fn(), onOpenChange: vi.fn(), onInputBlur: vi.fn(), renderItem: () => <PersonLabel /> }
	function App(props: any) { return <PersonProvider value={props.person}><BaseTypeaheadView {...props.view} /></PersonProvider> }
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createPortalObjectDriver())
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const find = (name: string) => all().find((node) => has(node, name))
	const attach = () => { for (const node of all()) { node.window = window; node.bounds = bounds; node.convertRectToView = () => bounds; for (const child of node.children ?? []) child.superview = node }; anchor.current = inputRef.current }
	const flush = () => { flushUniversalSync(() => {}); attach() }
	const notify = () => { for (const callback of [...observers.values()]) callback({ object: window }) }
	const render = (view = base, person = 'Avery') => { flushUniversalSync(() => root.render(App, { view, person })); attach(); notify(); flush() }
	const settle = async () => { for (let i = 0; i < 4; i++) { await Promise.resolve(); flush(); notify() }; flush() }
	render()
	return { root, base, render, settle, find, all, layers, inputRef, window, observers, viewport }
}
it('result content keeps declaring providers and current updates through the actual source portal', async () => {
	const f = fixture()
	try {
		await f.settle(); expect(f.layers).toHaveLength(1); expect(f.layers[0].show).toHaveBeenCalledTimes(1); expect(f.find('provider-value').props.text).toBe('Avery')
		f.render(f.base, 'Jordan'); await f.settle(); expect(f.find('provider-value').props.text).toBe('Jordan'); expect(f.layers).toHaveLength(1)
		expect(f.layers[0].options.component).toBeUndefined(); expect(f.window.firstResponder).toBe(null)
	} finally { f.root.unmount() }
	expect(f.observers.size).toBe(0); expect(f.layers[0].closed).toBe(true)
})
it('results have a bounded scrolling outlet and resize with current width and viewport', async () => {
	const f = fixture()
	try {
		await f.settle(); const scroll = () => f.all().find((node) => node.type === 'scrollview')
		expect(scroll().props.style).toMatchObject({ width: 180, maxHeight: 224 })
		f.viewport.size.width = 260; f.render({ ...f.base, menuWidth: 400 }); await f.settle(); expect(scroll().props.style).toMatchObject({ width: 244, maxHeight: 224 })
		expect(f.layers).toHaveLength(1)
	} finally { f.root.unmount() }
})
it('input, shared editor and popup descendants form one field-leave blur boundary with latest callbacks', async () => {
	const f = fixture(), event = { source: 'native blur' }
	try {
		await f.settle(); const shell = f.find('vx-typeahead'), popup = () => f.find('vx-typeahead-dropdown'), row = f.find('vx-typeahead-option')
		f.window.firstResponder = { delegate: f.inputRef.current }; popup().props.onBlur(event); expect(f.base.onInputBlur).not.toHaveBeenCalled()
		f.window.firstResponder = row; shell.props.onBlur(event); expect(f.base.onInputBlur).not.toHaveBeenCalled()
		const blur = vi.fn(); f.render({ ...f.base, onInputBlur: blur }); await f.settle(); f.window.firstResponder = {}; popup().props.onBlur(event)
		expect(blur).toHaveBeenCalledExactlyOnceWith(event); expect(f.base.onInputBlur).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('current blocking retires the portal, and held blur/commit callbacks cannot act after teardown', async () => {
	const f = fixture()
	await f.settle(); const blur = f.find('vx-typeahead-dropdown').props.onBlur, source = f.layers[0].source
	f.render({ ...f.base, isReadOnly: true }); await f.settle(); expect(f.layers[0].closed).toBe(true); expect(f.find('vx-typeahead-list')).toBeUndefined()
	f.root.unmount(); blur({}); source.unmount(); await f.settle(); expect(f.base.onInputBlur).not.toHaveBeenCalled(); expect(f.observers.size).toBe(0)
})

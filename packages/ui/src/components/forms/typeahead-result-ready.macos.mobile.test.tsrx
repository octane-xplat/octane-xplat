/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { BaseTypeaheadView } from './BaseTypeaheadView.macos.tsrx'
const outlet = vi.hoisted(() => ({ current: null as any }))
// This fixture explicitly signals the source-ready boundary. Actual portal
// ownership/commit gating has separate unmocked component and controller cases.
vi.mock('./TypeaheadResults.macos.tsrx', () => ({ TypeaheadResults: (props: any) => { outlet.current = props; return props.open ? props.children : null } }))
afterEach(() => vi.unstubAllGlobals())
function fixture() {
	const window: any = { firstResponder: null }, inputRef = { current: null as any }
	const base: any = { inputRef, anchor: inputRef, query: '', results: [{ id: 'a', label: 'Ada' }, { id: 'g', label: 'Grace' }], open: true, highlightedIndex: 1,
		isSearching: false, hasSearched: true, value: null, emptyText: 'Empty', onQueryChange: vi.fn(), onSelect: vi.fn(), onOpenChange: vi.fn() }
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const rows = () => all().filter((node) => String(node.props?.className).split(' ').includes('vx-typeahead-option'))
	const render = (props = base) => { flushUniversalSync(() => root.render(BaseTypeaheadView, props)); for (const node of all()) { node.window = window; node.bounds = {}; node.scrollRectToVisible ??= vi.fn() } }
	render(); window.firstResponder = inputRef.current
	return { root, base, render, rows, inputRef, window, ready: outlet.current.onReady }
}
it('a source-ready notification reveals the current highlight after rows attach without another field render', () => {
	const f = fixture()
	try { expect(f.rows()[1].scrollRectToVisible).not.toHaveBeenCalled(); f.ready(); expect(f.rows()[1].scrollRectToVisible).toHaveBeenCalledExactlyOnceWith(f.rows()[1].bounds); expect(f.rows()[0].scrollRectToVisible).not.toHaveBeenCalled(); expect(f.window.firstResponder).toBe(f.inputRef.current) }
	finally { f.root.unmount() }
})
it('retained readiness resolves current rows and rejects blocked, closed, foreign or retired owners', () => {
	const f = fixture()
	try {
		f.render({ ...f.base, highlightedIndex: 0 }); for (const row of f.rows()) row.scrollRectToVisible.mockClear()
		f.ready(); expect(f.rows()[0].scrollRectToVisible).toHaveBeenCalledTimes(1); expect(f.rows()[1].scrollRectToVisible).not.toHaveBeenCalled()
		for (const state of [{ isReadOnly: true }, { isDisabled: true }, { open: false }]) { f.render({ ...f.base, ...state }); const rows = f.rows(); for (const row of rows) row.scrollRectToVisible.mockClear(); f.ready(); for (const row of rows) expect(row.scrollRectToVisible).not.toHaveBeenCalled() }
		f.render(); f.rows()[1].window = {}; f.rows()[1].scrollRectToVisible.mockClear(); f.ready(); expect(f.rows()[1].scrollRectToVisible).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
	f.ready()
})
it('readiness preserves a foreign responder and accepts only the input-owned field editor', () => {
	const f = fixture(), editor = {}
	try {
		f.inputRef.current.currentEditor = () => editor; f.window.firstResponder = {}; f.ready(); expect(f.rows()[1].scrollRectToVisible).not.toHaveBeenCalled()
		f.window.firstResponder = editor; f.ready(); expect(f.rows()[1].scrollRectToVisible).toHaveBeenCalledTimes(1); expect(f.window.firstResponder).toBe(editor)
	} finally { f.root.unmount() }
})

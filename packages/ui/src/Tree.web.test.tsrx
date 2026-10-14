// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tree } from './Tree.web.tsrx'
import type { Key, Selection } from './props'

const nodes = [
	{ key: 'src', label: 'src', children: [{ key: 'app', label: 'App.tsrx' }] },
	{ key: 'docs', label: 'docs' },
]

const roots: ReturnType<typeof createRoot>[] = []
const hosts: HTMLElement[] = []

function host() {
	const el = document.createElement('div')
	document.body.appendChild(el)
	hosts.push(el)
	const root = createRoot(el)
	roots.push(root)
	return { el, root }
}

const rows = (el: HTMLElement) => [...el.querySelectorAll('.vx-tree-row')] as HTMLElement[]
const click = (target: HTMLElement) => act(() => target.click())

afterEach(() => {
	for (const root of roots.splice(0)) root.unmount()
	for (const el of hosts.splice(0)) el.remove()
})

describe('TreeList (web leaf)', () => {
	it('expands a parent row uncontrolled and reports the full open set', () => {
		const { el, root } = host()
		const onExpandedChange = vi.fn()
		act(() => root.render(
			<Tree nodes={nodes} defaultExpandedKeys={['docs']} onExpandedChange={onExpandedChange} />,
		))

		expect(el.textContent).not.toContain('App.tsrx')
		click(rows(el)[0])
		expect(el.textContent).toContain('App.tsrx')
		expect(onExpandedChange).toHaveBeenCalledTimes(1)
		expect([...(onExpandedChange.mock.calls[0][0] as Set<Key>)]).toEqual(['docs', 'src'])

		click(rows(el)[0])
		expect(el.textContent).not.toContain('App.tsrx')
		expect([...(onExpandedChange.mock.calls[1][0] as Set<Key>)]).toEqual(['docs'])
	})

	it('follows controlled expandedKeys without mutating them', () => {
		const { el, root } = host()
		const onExpandedChange = vi.fn()
		act(() => root.render(
			<Tree nodes={nodes} expandedKeys={[]} onExpandedChange={onExpandedChange} />,
		))

		click(rows(el)[0])
		// Controlled: the row reports the requested set but stays closed.
		expect([...(onExpandedChange.mock.calls[0][0] as Set<Key>)]).toEqual(['src'])
		expect(el.textContent).not.toContain('App.tsrx')

		act(() => root.render(
			<Tree nodes={nodes} expandedKeys={['src']} onExpandedChange={onExpandedChange} />,
		))
		expect(el.textContent).toContain('App.tsrx')
	})

	it('selects leaf rows by key under selectionMode and fires onAction', () => {
		const { el, root } = host()
		const onSelectionChange = vi.fn()
		const onAction = vi.fn()
		act(() => root.render(
			<Tree nodes={nodes} expandedKeys={['src']} selectionMode="single"
				onSelectionChange={onSelectionChange} onAction={onAction} />,
		))

		click(rows(el)[1])
		const selection = onSelectionChange.mock.calls[0][0] as Selection
		expect(selection).toBeInstanceOf(Set)
		expect([...(selection as Set<Key>)]).toEqual(['app'])
		expect(onAction).toHaveBeenCalledWith('app')

		// Parent presses expand rather than select; leaf keeps its key.
		click(rows(el)[0])
		expect(el.textContent).toContain('App.tsrx')
		expect(onSelectionChange).toHaveBeenCalledTimes(1)
		const selectedRow = el.querySelector('[role="treeitem"][aria-selected="true"] .vx-tree-row')
		expect(selectedRow?.textContent).toBe('App.tsrx')
	})

	it('toggles leaf selection under multiple and reports Selection', () => {
		const { el, root } = host()
		const onSelectionChange = vi.fn()
		act(() => root.render(
			<Tree nodes={nodes} selectionMode="multiple" onSelectionChange={onSelectionChange} />,
		))

		click(rows(el)[1])
		click(rows(el)[1])
		expect([...(onSelectionChange.mock.calls[1][0] as Set<Key>)]).toEqual([])
	})
})

// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { GridList } from './GridList'
import { useGridList } from './use-grid-list'

// GridList web lane — role structure, roving-tabindex 2D arrow navigation,
// and RA selection semantics (toggle/replace/single/shift-range) on the
// DOM renderer.

const items = [
	{ id: 'a', name: 'Alpha' },
	{ id: 'b', name: 'Beta' },
	{ id: 'c', name: 'Gamma' },
	{ id: 'd', name: 'Delta' },
	{ id: 'e', name: 'Epsilon' },
	{ id: 'f', name: 'Zeta' },
]

const render = (props: any = {}) => {
	const el = document.createElement('div')
	document.body.appendChild(el)
	const root = createRoot(el)
	act(() =>
		root.render(
			<GridList
				items={items}
				keyExtractor={(item: any) => item.id}
				renderItem={(item: any) => <span>{item.name}</span>}
				{...props}
			/>,
		),
	)

	const rows = () => Array.from(el.querySelectorAll<HTMLElement>('[role="row"]'))
	return { el, root, rows }
}

const key = (target: HTMLElement, name: string, init: KeyboardEventInit = {}) =>
	act(() => {
		target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...init }))
	})

const click = (target: HTMLElement, init: MouseEventInit = {}) =>
	act(() => {
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }))
	})

describe('GridList (DOM renderer)', () => {
	it('useGridList reports keyboard navigation as supported', () => {
		let captured: any
		function Probe() @{
			captured = useGridList({ columns: 2 })

			<div />
		}

		const el = document.createElement('div')
		document.body.appendChild(el)
		const root = createRoot(el)
		act(() => root.render(<Probe />))
		expect(captured.isSupported).toBe(true)
		expect(typeof captured.gridProps.onKeyDown).toBe('function')

		root.unmount()
		el.remove()
	})

	it('renders role=grid > role=row > role=gridcell with a roving tab stop', () => {
		const { el, root, rows } = render({ accessibilityLabel: 'Cells' })
		expect(el.querySelector('[role="grid"]')).not.toBeNull()
		expect(el.querySelectorAll('[role="gridcell"]').length).toBe(6)
		expect(rows().map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1, -1])
		expect(el.querySelector<HTMLElement>('[role="grid"]')!.getAttribute('aria-label')).toBe('Cells')

		root.unmount()
		el.remove()
	})

	it('moves focus in 2D: arrows by one column, Home/End to the edges', () => {
		const { el, root, rows } = render({ columns: 3 })
		const [a, b, , , e] = rows()

		key(a, 'ArrowRight')
		expect(document.activeElement).toBe(b)
		key(b, 'ArrowDown')
		expect(document.activeElement).toBe(e)
		key(e, 'ArrowUp')
		expect(document.activeElement).toBe(b)
		key(b, 'End')
		expect(document.activeElement).toBe(rows()[5])
		key(rows()[5], 'Home')
		expect(document.activeElement).toBe(rows()[0])

		root.unmount()
		el.remove()
	})

	it('skips disabled rows in arrow navigation', () => {
		const { el, root, rows } = render({ columns: 2, disabledKeys: ['b'] })
		key(rows()[0], 'ArrowRight')
		expect(document.activeElement).toBe(rows()[2])
		expect(rows()[1].getAttribute('aria-disabled')).toBe('true')
		root.unmount()
		el.remove()
	})

	it('toggles selection on click, extends ranges on shift+click', () => {
		const onSelectionChange = vi.fn()
		const { el, root, rows } = render({ selectionMode: 'multiple', onSelectionChange })
		click(rows()[0])
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a']))
		click(rows()[3], { shiftKey: true })
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b', 'c', 'd']))
		expect(rows()[2].getAttribute('aria-selected')).toBe('true')
		click(rows()[0])
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b', 'c', 'd']))
		root.unmount()
		el.remove()
	})

	it('replaces selection under selectionBehavior="replace" and toggles in single mode', () => {
		const onSelectionChange = vi.fn()
		const { el, root, rows } = render({
			selectionMode: 'multiple',
			selectionBehavior: 'replace',
			onSelectionChange,
		})

		click(rows()[0])
		click(rows()[2])
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['c']))
		root.unmount()
		el.remove()

		const single = render({ selectionMode: 'single' })
		click(single.rows()[0])
		expect(single.rows()[0].getAttribute('aria-selected')).toBe('true')
		click(single.rows()[0])
		expect(single.rows()[0].getAttribute('aria-selected')).toBe('false')
		single.root.unmount()
		single.el.remove()
	})

	it('fires onAction on click/Enter and toggles selection on Space without it', () => {
		const onAction = vi.fn()
		const onSelectionChange = vi.fn()
		const { el, root, rows } = render({ selectionMode: 'multiple', onAction, onSelectionChange })
		click(rows()[1])
		expect(onAction).toHaveBeenCalledWith('b')
		key(rows()[2], 'Enter')
		expect(onAction).toHaveBeenCalledWith('c')
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b', 'c']))
		key(rows()[3], ' ')
		expect(onAction).toHaveBeenCalledTimes(2)
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b', 'c', 'd']))
		root.unmount()
		el.remove()
	})

	it('disables presses on disabledKeys and honors selectionMode="none"', () => {
		const onAction = vi.fn()
		const onSelectionChange = vi.fn()
		const { el, root, rows } = render({
			selectionMode: 'multiple',
			disabledKeys: ['b'],
			onAction,
			onSelectionChange,
		})

		click(rows()[1])
		expect(onAction).not.toHaveBeenCalled()
		expect(onSelectionChange).not.toHaveBeenCalled()
		root.unmount()
		el.remove()

		const none = render({ selectionMode: 'none', onAction })
		expect(none.rows()[0].hasAttribute('aria-selected')).toBe(false)
		click(none.rows()[0])
		expect(onAction).toHaveBeenCalledWith('a')
		expect(onSelectionChange).toHaveBeenCalledTimes(0)
		none.root.unmount()
		none.el.remove()
	})

	it('honors controlled selectedKeys and keyboardNavigationBehavior="tab"', () => {
		const onSelectionChange = vi.fn()
		const { el, root, rows } = render({
			selectionMode: 'multiple',
			selectedKeys: new Set(['a', 'c']),
			keyboardNavigationBehavior: 'tab',
			onSelectionChange,
		})

		expect(rows()[0].getAttribute('aria-selected')).toBe('true')
		expect(rows()[1].getAttribute('aria-selected')).toBe('false')
		expect(rows().every((r) => r.tabIndex === 0)).toBe(true)
		click(rows()[1])
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b', 'c']))
		// Controlled: view stays on the prop value until the parent updates it.
		expect(rows()[1].getAttribute('aria-selected')).toBe('false')
		root.unmount()
		el.remove()
	})

	it('renders the empty state and stacks under layout="stack"', () => {
		const { el, root } = render({ items: [], renderEmpty: () => <em>Nothing here</em> })
		expect(el.querySelector('[role="row"]')).toBeNull()
		expect(el.textContent).toContain('Nothing here')
		root.unmount()

		const stacked = render({ layout: 'stack' })
		expect(stacked.el.querySelector('.vx-gridlist--stack')).not.toBeNull()
		stacked.root.unmount()
		stacked.el.remove()
		el.remove()
	})
})

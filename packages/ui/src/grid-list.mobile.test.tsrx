/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

import { GridList } from './GridList.tsrx'
import { useGridList } from './use-grid-list.tsrx'

// GridList native lane — tap activates onAction and toggles selection via
// the shared selection mapping; arrow nav/roving tabindex are web-only.
// useGridList returns an inert prop bag with isSupported:false — same shape.

const items = [
	{ id: 'a', name: 'Alpha' },
	{ id: 'b', name: 'Beta' },
	{ id: 'c', name: 'Gamma' },
]

let captured: any

const Probe = (props: any) => @{
	captured = useGridList({ columns: props.columns })

	<label text="probe" />
}

describe('GridList (universal renderer)', () => {
	it('renders cells and toggles selection + onAction on tap', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const onAction = vi.fn()
		const onSelectionChange = vi.fn()
		root.render(GridList as any, {
			items,
			keyExtractor: (item: any) => item.id,
			renderItem: (item: any) => item.name,
			selectionMode: 'multiple',
			onAction,
			onSelectionChange,
		})

		const grid = container.children[0]
		expect(grid.type).toBe('flexboxlayout')
		expect(grid.props.flexWrap).toBe('wrap')
		const rows = grid.children
		expect(rows.length).toBe(3)
		expect(rows[0].type).toBe('flexboxlayout')

		container.dispatchEvent(rows[0], 'tap', {})
		expect(onAction).toHaveBeenCalledWith('a')
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a']))
		container.dispatchEvent(rows[1], 'tap', {})
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b']))
		container.dispatchEvent(rows[0], 'tap', {})
		expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b']))
		root.unmount()
	})

	it('blocks disabled keys and lays out stacked under layout="stack"', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const onAction = vi.fn()
		root.render(GridList as any, {
			items,
			keyExtractor: (item: any) => item.id,
			renderItem: (item: any) => item.name,
			layout: 'stack',
			disabledKeys: ['b'],
			onAction,
		})

		const rows = container.children[0].children
		expect(container.children[0].props.flexWrap).toBe('nowrap')
		expect(rows[1].props.accessibilityState).toBe('disabled')
		expect(() => container.dispatchEvent(rows[1], 'tap', {})).toThrow('no "tap" listener')
		expect(onAction).not.toHaveBeenCalled()
		root.unmount()
	})

	it('useGridList reports keyboard navigation unsupported with an inert prop bag', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Probe as any, { columns: 2 })
		expect(captured.gridRef).toBeDefined()
		expect(captured.isSupported).toBe(false)
		expect(captured.gridProps).toEqual({})
		root.unmount()
	})
})

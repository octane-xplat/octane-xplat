/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { useState } from 'octane'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true, Application: {} }))
vi.mock('../../ui/src/pan.tsrx', () => ({ usePan: () => undefined }))
vi.mock('@octane-xplat/ui', () => import('../tests/native-controls.mobile.tsrx'))
import { DataGrid } from './DataGrid.tsrx'

const data = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }, { id: 'c', name: 'Charlie' }]
const columns = [{ accessorKey: 'name', header: 'Name' }]

function find(nodes: any[], id: string): any {
	for (const node of nodes) {
		if (node.props?.id === id) return node
		const child = find(node.children ?? [], id)
		if (child) return child
	}
}

function Controlled() {
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
	return <DataGrid id="grid" data={data} columns={columns} getRowId={(row) => row.id}
		getRowLabel={(row) => row.original.name} showRowSelection showPagination
		state={{ rowSelection }} options={{ onRowSelectionChange: setRowSelection }}
		initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }} />
}

describe('native DataGrid selection integration', () => {
	it('updates retained controls for caller state, mixed selection and off-page ordinals', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Controlled as any, {})
		const get = (id: string) => find(container.children, id)
		const press = (id: string) => flushUniversalSync(() => container.dispatchEvent(get(id), 'tap', {}))
		const page = get('grid-select-page')
		expect(get('grid-select-a').props.accessibilityLabel).toBe('Select Alice')
		expect(get('grid-select-a').props.accessibilityHint).toBe('Row 1 of 3')
		press('grid-select-a')
		expect(get('grid-select-page')).toBe(page)
		expect(page.props.accessibilityValue).toBe('Partially selected')
		expect(page.props.accessibilityState).toBeUndefined()
		press('grid-select-page')
		expect(page.props.accessibilityValue).toBeUndefined()
		expect(page.props.accessibilityState).toBe('checked')
		press('grid-next')
		expect(get('grid-select-c').props.accessibilityHint).toBe('Row 3 of 3')
		expect(page.props.accessibilityState).toBe('unchecked')
		press('grid-clear-selection')
		press('grid-previous')
		expect(get('grid-select-a').props.accessibilityState).toBe('unchecked')
		root.unmount()
	})
})

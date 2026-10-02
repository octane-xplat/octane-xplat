import { useState } from 'octane'
import { DataGrid, type DataGridFeatures, type TableState } from '@octane-xplat/table'
import { View, Text } from '@octane-xplat/ui'
import { GridHost } from './host'
import { selectionState, rowPosition, scrollBody } from './selection-host'
import type { ProbeContext } from '../../../scripts/probe/context'

const data = Array.from({ length: 60 }, (_, index) => ({ id: String(index), name: `Record ${index + 1}` }))
const columns = [{ accessorKey: 'name', header: 'Name' }]

/** Real VirtualList and platform controls; no screenshot or OS-input claims. */
export default function SelectionGrid() {
	const [rowSelection, setRowSelection] = useState<TableState<DataGridFeatures>['rowSelection']>({ absent: true })
	return <GridHost><View style={{ height: 340 }}>
		<DataGrid id="selection" data={data} columns={columns} getRowId={row => row.id}
			getRowLabel={row => row.original.name} showRowSelection showPagination
			state={{ rowSelection }} options={{ onRowSelectionChange: setRowSelection, enableRowSelection: row => row.id !== '1' }}
			initialState={{ pagination: { pageIndex: 0, pageSize: 30 } }}
			renderEmpty={() => <Text>No results</Text>} />
	</View></GridHost>
}

function textOf(view: any): string {
	if (typeof view?.textContent === 'string') return view.textContent
	const own = view?.text ?? view?.stringValue ?? view?.title
	if (typeof own === 'string' && own) return own
	if (view?.subviews) return Array.from(view.subviews).map(textOf).join('')
	let result = ''
	view?.eachChildView?.((child: any) => { result += textOf(child); return true })
	return result
}

export async function run(ctx: ProbeContext) {
	const count = () => textOf(ctx.find('selection-selected-count'))
	await ctx.waitFor(() => ctx.find('selection-select-0'))
	ctx.assert('caller owns absent ID', count(), '1 selected')
	ctx.assert('first row position', rowPosition(ctx.find('selection-row-0'), ctx.find('selection-select-0')), 'Row 1 of 60')
	await ctx.press('selection-select-0')
	await ctx.waitFor(() => count() === '2 selected')
	ctx.assert('mixed page selection', selectionState(ctx.find('selection-select-page')), 'mixed')
	await ctx.press('selection-select-page')
	await ctx.waitFor(() => count() === '30 selected')
	ctx.assert('all eligible page rows selected', selectionState(ctx.find('selection-select-page')), 'checked')
	await ctx.press('selection-next')
	await ctx.waitFor(() => ctx.find('selection-select-30'))
	ctx.assert('off-page IDs retained', count(), '30 selected')
	ctx.assert('next page row position', rowPosition(ctx.find('selection-row-30'), ctx.find('selection-select-30')), 'Row 31 of 60')
	await ctx.press('selection-select-30')
	await ctx.waitFor(() => count() === '31 selected')
	// Move the real viewport; inspect a recycled row's full-dataset position.
	scrollBody(ctx.find('selection-body'), 700)
	await ctx.waitFor(() => ctx.find('selection-select-50'))
	ctx.assert('windowed row position', rowPosition(ctx.find('selection-row-50'), ctx.find('selection-select-50')), 'Row 51 of 60')
	await ctx.press('selection-clear-selection')
	await ctx.waitFor(() => count() === '0 selected')
	ctx.assert('clear includes absent and off-page IDs', count(), '0 selected')
}

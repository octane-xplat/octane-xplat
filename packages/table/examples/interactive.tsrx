import { DataGrid } from '@octane-xplat/table'
import { View, Text } from '@octane-xplat/ui'
import { pan } from './gesture'
import { GridHost } from './host'
import type { ProbeContext } from '../../../scripts/probe/context'

const data = [
	{ id: 'a', name: 'Alice', count: 1 },
	{ id: 'b', name: 'Bob', count: 2 },
	{ id: 'c', name: 'Charlie', count: 3 },
]

const columns = [
	{
		accessorKey: 'name',
		header: 'Name',
		size: 140,
		minSize: 100,
		maxSize: 180,
		enableHiding: false,
	},
	{ accessorKey: 'count', header: 'Count', size: 100 },
]

/** Maintained interaction fixture: only the body scrolls; controls stay reachable. */
export default function InteractiveGrid() {
	return (
		<GridHost>
			<View style={{ height: 650 }}>
				<DataGrid
					id="grid"
					data={data}
					columns={columns}
					getRowId={(row) => row.id}
					showGlobalFilter
					showColumnFilters
					showPagination
					showRowSelection
					showColumnSettings
					resizableColumns
					reorderableColumns
					initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}
					options={{ enableRowSelection: (row) => row.id !== 'b' }}
					renderEmpty={() => <Text id="grid-empty">No matching rows</Text>}
				/>
			</View>
		</GridHost>
	)
}

function textOf(view: any): string {
	if (!view) return ''
	const cls = String(view.className ?? '')
	if (cls.includes('vx-datagrid-selection')) return ''
	if (cls.includes('vx-table-row') && view.children)
		return Array.from(view.children).map(textOf).join('')

	if (typeof view.textContent === 'string') return view.textContent
	if (typeof view.text === 'string' && view.text) return view.text
	let result = ''
	view.eachChildView?.((child: any) => {
		result += textOf(child)
		return true
	})

	return result
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('grid-select-a'))
	const text = (id: string) => textOf(ctx.find(id))
	ctx.assert('initial page', text('grid-page'), 'Page 1 of 2')
	await ctx.press('grid-select-a')
	await ctx.waitFor(() => text('grid-selected-count') === '1 selected')
	ctx.assert('selection count', text('grid-selected-count'), '1 selected')
	await ctx.press('grid-next')
	await ctx.waitFor(() => text('grid-row-c') === 'Charlie3')
	ctx.assert('next page row', text('grid-row-c'), 'Charlie3')
	await ctx.press('grid-select-page')
	await ctx.waitFor(() => text('grid-selected-count') === '2 selected')
	ctx.assert(
		'page-scoped select keeps off-page selection',
		text('grid-selected-count'),
		'2 selected',
	)

	await ctx.setText('grid-search', 'ali')
	await ctx.waitFor(() => text('grid-page') === 'Page 1 of 1' && text('grid-row-a') === 'Alice1')
	ctx.assert('filter resets page', text('grid-page'), 'Page 1 of 1')
	await ctx.setText('grid-search', 'no match')
	await ctx.waitFor(() => ctx.find('grid-empty'))
	ctx.assert('empty filter result', text('grid-empty'), 'No matching rows')
	await ctx.setText('grid-search', '')
	await ctx.waitFor(() => ctx.find('grid-row-a'))
	await ctx.press('grid-settings')
	await ctx.waitFor(() => ctx.find('grid-visible-count'))
	await ctx.press('grid-visible-count')
	await ctx.waitFor(() => !ctx.find('grid-th-count'))
	ctx.assert('column hidden', Boolean(ctx.find('grid-th-count')), false)
	await ctx.press('grid-visible-count')
	await ctx.waitFor(() => ctx.find('grid-th-count'))
	await ctx.press('grid-earlier-count')
	await ctx.waitFor(() => text('grid-row-a') === '1Alice')
	ctx.assert('reordered cells', text('grid-row-a'), '1Alice')
	await ctx.press('grid-reset-columns')
	await ctx.waitFor(() => text('grid-row-a') === 'Alice1')
	ctx.assert('reset columns', text('grid-row-a'), 'Alice1')
	await ctx.press('grid-settings')
	// NativeScript's initial screen-sized frame is positive even before layout.
	await ctx.waitFor(() => {
		const header = ctx.find('grid-th-name') as any
		const grid = ctx.find('grid') as any
		return (
			header && grid &&
			header.isLoaded !== false && grid.isLoaded !== false &&
			header.isLayoutValid !== false && grid.isLayoutValid !== false &&
			(ctx.inspect('grid-th-name').frame?.width ?? 0) > 0
		)
	})

	ctx.record('before-width-header', ctx.inspect('grid-th-name'))
	ctx.record('before-width-grid', ctx.inspect('grid'))
	const before = ctx.inspect('grid-th-name').frame!.width
	await ctx.press('grid-th-name-widen')
	await ctx.waitFor(() => Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 10) < 1)
	ctx.assert(
		'width action updates header',
		Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 10) < 1,
		true,
	)

	pan(ctx, 'grid-th-name-resize', 200)
	await ctx.waitFor(() => Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1)
	ctx.assert(
		'resize clamps to maxSize',
		Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1,
		true,
	)

	pan(ctx, 'grid-th-name-resize', -60, true)
	await ctx.waitFor(() => Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1)
	ctx.assert(
		'cancel restores width',
		Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1,
		true,
	)

	pan(ctx, 'grid-th-name-drag', 200, true)
	ctx.assert('cancel preserves column order', text('grid-row-a'), 'Alice1')
	pan(ctx, 'grid-th-name-drag', 200)
	await ctx.waitFor(() => text('grid-row-a') === '1Alice')
	ctx.assert('pan reorder commits', text('grid-row-a'), '1Alice')
	await ctx.press('grid-clear-selection')
	await ctx.waitFor(() => text('grid-selected-count') === '0 selected')
	ctx.assert('clear selection', text('grid-selected-count'), '0 selected')
}

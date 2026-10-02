import { DataGrid } from '@octane-xplat/table'
import { View } from '@octane-xplat/ui'
import { GridHost } from './host'
import { pan } from './gesture'
import type { ProbeContext } from '../../../scripts/probe/context'

const data = [{ id: 'a', name: 'Alice', count: 1 }, { id: 'b', name: 'Bob', count: 2 }, { id: 'c', name: 'Charlie', count: 3 }]
const columns = [
	{ accessorKey: 'name', header: 'Name', size: 140, minSize: 100, maxSize: 180 },
	{ accessorKey: 'count', header: 'Count', size: 100 },
]

/** Bounded geometry regression without filter/pager input dependencies. */
export default function GridGeometry() {
	return <GridHost><View style={{ height: 300 }}>
		<DataGrid id="grid" data={data} columns={columns} getRowId={row => row.id} resizableColumns reorderableColumns />
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
	await ctx.waitFor(() => ctx.find('grid-row-c'))
	await new Promise(resolve => setTimeout(resolve, 300))
	for (const id of ['grid', 'grid-header', 'grid-body', 'grid-th-name']) ctx.record(id, ctx.inspect(id))
	ctx.assert('bounded grid height', ctx.inspect('grid').frame?.height, 300)
	ctx.assert('bounded header', ctx.inspect('grid-header').frame!.height < 100, true)
	const text = (id: string) => textOf(ctx.find(id))
	await ctx.press('grid-th-name')
	await ctx.press('grid-th-name')
	await ctx.waitFor(() => text('grid-row-c') === 'Charlie3')
	const rowY = (id: string) => {
		const view = ctx.find(id)
		if (view.convertRectToView) {
			const doc = ctx.find('grid-body').documentView
			const flip = typeof doc.isFlipped === 'function' ? doc.isFlipped() : doc.isFlipped
			const y = Number(view.convertRectToView(view.bounds, doc).origin.y)
			return flip ? y : -y
		}

		return ctx.inspect(id).frame!.y
	}

	await ctx.waitFor(() => rowY('grid-row-c') < rowY('grid-row-a'))
	ctx.assert('descending row geometry', rowY('grid-row-c') < rowY('grid-row-a'), true)
	const before = ctx.inspect('grid-th-name').frame!.width
	await ctx.press('grid-th-name-widen')
	await ctx.waitFor(() => Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 10) < 1)
	ctx.assert('width button', Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 10) < 1, true)
	pan(ctx, 'grid-th-name-resize', 200)
	await ctx.waitFor(() => Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1)
	ctx.assert('resize clamps width', Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1, true)
	pan(ctx, 'grid-th-name-resize', -60, true)
	ctx.assert('resize cancellation', Math.abs(ctx.inspect('grid-th-name').frame!.width - before - 40) < 1, true)
	pan(ctx, 'grid-th-name-drag', 200, true)
	ctx.assert('reorder cancellation', text('grid-row-a'), 'Alice1')
	pan(ctx, 'grid-th-name-drag', 200)
	await ctx.waitFor(() => text('grid-row-a') === '1Alice')
	ctx.assert('reordered cells', text('grid-row-a'), '1Alice')
}

/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import { VirtualList } from '../src/VirtualList.macos.tsrx'
import type { ProbeContext } from '../../../scripts/probe/context'

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
const keyExtractor = (item: { id: string }) => item.id
const renderItem = (item: { id: string }, index: number) => <label id={'row-' + item.id} text={item.id + ':' + index} style={{ height: 32 }} />

export default function ListReorder() @{
	const [rows, setRows] = useState(items)

	<flexboxlayout flexDirection="column" style={{ width: 280, height: 240 }}>
		<flexboxlayout id="sort" onTap={() => setRows([...rows].reverse())}><label text="Reverse" /></flexboxlayout>
		<VirtualList id="list" style={{ height: 160 }} items={rows} keyExtractor={keyExtractor} renderItem={renderItem} />
	</flexboxlayout>
}

export async function run(ctx: ProbeContext) {
	await new Promise(resolve => setTimeout(resolve, 500))
	ctx.record('initial list', ctx.inspect('list'))
	ctx.record('mounted rows', ['row-a', 'row-b', 'row-c'].map(id => Boolean(ctx.find(id))))
	await ctx.waitFor(() => ctx.find('row-c'))
	const retained = ctx.find('row-a')
	await ctx.press('sort')
	await ctx.waitFor(() => ctx.inspect('row-c').text === 'c:0')
	ctx.assert('updated keyed ordinal', ctx.inspect('row-a').text, 'a:2')
	ctx.assert('retained keyed view', ctx.find('row-a') === retained, true)
	const y = (id: string) => {
		const view = ctx.find(id)
		return Number(view.convertRectToView(view.bounds, ctx.find('list').documentView).origin.y)
	}

	ctx.inspect('list')
	ctx.record('row positions after reverse', ['row-a', 'row-b', 'row-c'].map(id => ({ id, y: y(id) })))
	const doc = ctx.find('list').documentView
	const flipped = typeof doc.isFlipped === 'function' ? doc.isFlipped() : doc.isFlipped
	ctx.assert('native rows follow descending data', flipped ? y('row-c') < y('row-a') : y('row-c') > y('row-a'), true)
	await ctx.press('sort')
	await ctx.waitFor(() => ctx.inspect('row-a').text === 'a:0')
	ctx.inspect('list')
	ctx.assert('native rows restore ascending data', flipped ? y('row-a') < y('row-c') : y('row-a') > y('row-c'), true)
}

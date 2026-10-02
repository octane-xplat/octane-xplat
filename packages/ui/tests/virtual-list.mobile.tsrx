/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { VirtualList } from '../src/VirtualList'
import type { ProbeContext } from '../../../scripts/probe/context'

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
const keyExtractor = (item: { id: string }) => item.id
const renderItem = (item: { id: string }, index: number) => <label id={'row-' + item.id} text={item.id + ':' + index} height={32} />

export default function ListGeometry() @{
	const [rows, setRows] = useState(items)

	<rootlayout>
		<flexboxlayout id="bounded" flexDirection="column" width={280} height={240}>
			<label id="sort" text="Reverse" height={40} onTap={() => setRows([...rows].reverse())} />
			<VirtualList id="list" style={{ height: 160 }} items={rows} keyExtractor={keyExtractor} renderItem={renderItem}
				renderHeader={() => <label id="header" text="Header" height={24} />} />
		</flexboxlayout>
	</rootlayout>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('row-c'))
	await new Promise(resolve => setTimeout(resolve, 300))
	for (const id of ['bounded', 'list', 'header', 'row-a', 'row-b', 'row-c']) ctx.record(id, ctx.inspect(id))
	ctx.assert('bounded viewport height', ctx.inspect('list').frame?.height, 160)
	ctx.assert('header intrinsic height', ctx.inspect('header').frame?.height, 24)
	for (const id of ['row-a', 'row-b', 'row-c']) ctx.assert(id + ' intrinsic height', ctx.inspect(id).frame?.height, 32)
	ctx.assert('measured row placement', ctx.inspect('row-c').frame!.y - ctx.inspect('row-a').frame!.y, 64)
	await ctx.press('sort')
	await ctx.waitFor(() => ctx.inspect('row-c').text === 'c:0')
	ctx.assert('updated keyed ordinal', ctx.inspect('row-a').text, 'a:2')
	await new Promise(resolve => setTimeout(resolve, 300))
	ctx.assert('reordered native geometry', ctx.inspect('row-c').frame!.y < ctx.inspect('row-a').frame!.y, true)
}

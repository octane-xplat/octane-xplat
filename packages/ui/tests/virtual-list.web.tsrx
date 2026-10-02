import { useState } from 'octane'
import { VirtualList } from '../src/VirtualList.web.tsrx'
import type { ProbeContext } from '../../../scripts/probe/context'

const items = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }))
const keyExtractor = (item: { id: string }) => item.id

export default function ListResize() @{
	const [height, setHeight] = useState(32)
	const [width, setWidth] = useState(280)

	<div>
		<button id="resize" onClick={() => { setHeight(height === 32 ? 48 : 32); setWidth(width === 280 ? 240 : 280) }}>Resize</button>
		<VirtualList id="list" style={{ height: 160, width }} items={items} keyExtractor={keyExtractor}
			renderItem={(item) => <div id={'row-' + item.id} style={{ height }}>{item.id}</div>}
			renderHeader={() => <div id="header" style={{ height: 24 }}>Header</div>} />
	</div>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('row-4'))
	await new Promise(resolve => setTimeout(resolve, 250))
	ctx.assert('bounded viewport', ctx.inspect('list').frame?.height, 160)
	ctx.assert('row intrinsic height', ctx.inspect('row-0').frame?.height, 32)
	const list = ctx.find('list') as HTMLElement
	list.scrollTop = 344
	list.dispatchEvent(new Event('scroll'))
	await ctx.waitFor(() => ctx.find('row-10'))
	for (let i = 0; i < 4; i++) {
		await ctx.press('resize')
		await new Promise(resolve => setTimeout(resolve, 250))
	}

	ctx.assert('retained anchor after resize bursts', Boolean(ctx.find('row-10')), true)
	ctx.assert('restored row height', ctx.inspect('row-10').frame?.height, 32)
	ctx.record('settled viewport', ctx.inspect('list'))
	ctx.record('settled offset', list.scrollTop)
	ctx.assert('anchor offset after resize bursts', Math.abs(list.scrollTop - 344) < 2, true)
}

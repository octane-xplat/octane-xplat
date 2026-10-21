/** @jsxImportSource @nativescript-community/octane */
import { VirtualList } from '../src/VirtualList'
import { View } from '../src/View'
import { Text } from '../src/Text'
import type { VirtualListHandle } from '../src/props'
import type { ProbeContext } from '../../../scripts/probe/context'

const rows = Array.from({ length: 500 }, (_, index) => ({ id: String(index) }))
let handle: VirtualListHandle | null = null
const keyExtractor = (row: { id: string }) => row.id
const renderRow = (row: { id: string }) => <View id={'contract-row-' + row.id} style={{ height: 96, flexShrink: 0 }}><Text>{row.id}</Text></View>

export default function ScrollContract() @{
    <VirtualList id="contract-list" ref={(value: VirtualListHandle | null) => { handle = value }}
        items={rows} keyExtractor={keyExtractor} renderItem={renderRow} style={{ width: 320, height: 288 }} />
}

export async function run(ctx: ProbeContext) {
    await ctx.mount(ScrollContract)
    await ctx.waitFor(() => handle && ctx.find('contract-row-0') && (ctx.inspect('contract-list').frame?.height ?? 0) > 0)
    const aligned = (id: string) => {
        if (!ctx.find(id)) return false
        const list = ctx.inspect('contract-list').frame
        const row = ctx.inspect(id).frame
        return Boolean(list && row && row.height > 0 && Math.abs(row.y - list.y) <= 2)
    }
    ctx.record('initial viewport', ctx.inspect('contract-list'))
    ctx.assert('destination is outside the initial window', Boolean(ctx.find('contract-row-120')), false)
    handle!.scrollToIndex(120)
    await ctx.waitFor(() => aligned('contract-row-120'), { timeout: 5000, interval: 20 })
    ctx.assert('forward seek aligns a previously unmounted row with the viewport', aligned('contract-row-120'), true)
    ctx.record('forward row', ctx.inspect('contract-row-120'))
    handle!.scrollToOffset(0)
    await ctx.waitFor(() => aligned('contract-row-0'), { timeout: 5000, interval: 20 })
    ctx.assert('return seek aligns the first row with the viewport', aligned('contract-row-0'), true)
    ctx.record('returned row', ctx.inspect('contract-row-0'))
}

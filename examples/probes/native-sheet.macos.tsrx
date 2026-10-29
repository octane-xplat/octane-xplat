/** @jsxImportSource @octane-xplat/jsx */
import { NativeSheetDemo } from '../../packages/demos/src/NativeSheetDemo.macos.tsrx'
import type { ProbeContext } from '../../scripts/probe/context'

export default NativeSheetDemo
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('native-sheet-status'))
	ctx.record('qualification', 'Mounted demo only; native sheet opening, input, focus, queueing, context, teardown and AX not exercised')
}

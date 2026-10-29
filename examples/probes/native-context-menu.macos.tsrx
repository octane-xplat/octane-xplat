/** @jsxImportSource @octane-xplat/jsx */
import { NativeContextMenuDemo } from '../../packages/demos/src/NativeContextMenuDemo.macos.tsrx'
import type { ProbeContext } from '../../scripts/probe/context'

export default NativeContextMenuDemo
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('native-context-menu-status'))
	ctx.record('qualification', 'Mounted demo only; native menus, responder propagation, selections, input and AX not exercised')
}

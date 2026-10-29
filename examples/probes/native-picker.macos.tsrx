/** @jsxImportSource @octane-xplat/jsx */
import { NativePickerDemo } from '../../packages/demos/src/NativePickerDemo.macos.tsrx'
import type { ProbeContext } from '../../scripts/probe/context'

export default NativePickerDemo
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('native-picker-status'))
	ctx.record('qualification', 'Mounted demo only; native picker opening, pointer/keyboard selection, tracking, focus, AX and lifecycle not exercised')
}

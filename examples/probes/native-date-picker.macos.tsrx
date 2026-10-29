/** @jsxImportSource @octane-xplat/jsx */
import { NativeDatePickerDemo } from '../../packages/demos/src/NativeDatePickerDemo.macos.tsrx'
import type { ProbeContext } from '../../scripts/probe/context'

export default NativeDatePickerDemo
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('native-date-picker-status'))
	ctx.record('qualification', 'Mounted demo only; date entry, range/mode/control changes, input, layout and AX not exercised')
}

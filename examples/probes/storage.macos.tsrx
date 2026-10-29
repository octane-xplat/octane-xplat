/** @jsxImportSource @octane-xplat/jsx */
import { StorageControls } from '../../packages/app/src/Storage.macos.tsrx'
import type { ProbeContext } from '../../scripts/probe/context'

export default StorageControls
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('appkit-storage-status'))
	ctx.record('qualification', 'Mounted controls only; no storage, restart, OS lifecycle or native input operation exercised')
}

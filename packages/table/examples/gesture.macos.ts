import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import type { ProbeContext } from '../../../scripts/probe/context'

/** AppKit handler dispatch only; no OS mouse input or hit-testing. */
export function pan(ctx: ProbeContext, id: string, dx: number, cancelled = false) {
	const view = ctx.find(id)
	const root = createMacOSRoot(ctx.host.contentView)
	try {
		for (const [state, deltaX] of [
			[1, 0],
			[2, dx],
			[cancelled ? 0 : 3, dx],
		]) {
			;(root as any).__macosDebug.panView(view, { state, deltaX, deltaY: 0 })
		}
	} finally {
		root.unmount()
	}
}

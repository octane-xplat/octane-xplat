import type { ProbeContext } from '../../../scripts/probe/context'

/** Pointer dispatch only: this does not prove OS input or hit-testing. */
export function pan(ctx: ProbeContext, id: string, dx: number, cancelled = false) {
	const view = ctx.find(id)
	for (const [type, x] of [['pointerdown', 0], ['pointermove', dx], [cancelled ? 'pointercancel' : 'pointerup', dx]] as const) {
		view.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 0, pointerId: 1, bubbles: true }))
	}
}

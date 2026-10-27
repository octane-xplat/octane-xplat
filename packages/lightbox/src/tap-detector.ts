import type { Intent, PointerKind, XY } from './gesture-machine'

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30
const TAP_DELAY_MS = 260

/**
 * Web adapter tap timing, upstream's 300 ms / 30 px double-tap window and the
 * 260 ms delayed single tap. `waitForDouble` is false when zoom is off and for
 * a mouse tap on the backdrop — those fires happen immediately.
 */
export function createTapDetector(opts: {
	now(): number
	schedule(fn: () => void, ms: number): () => void
}): {
	up(at: XY, pointer: PointerKind, waitForDouble: boolean, emit: (i: Intent) => void): void
	cancel(): void
} {
	let lastTap: (XY & { t: number }) | null = null
	let cancelTimer: (() => void) | null = null
	return {
		up(at, pointer, waitForDouble, emit) {
			cancelTimer?.()
			cancelTimer = null
			const now = opts.now()
			if (waitForDouble) {
				if (lastTap && now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(at.x - lastTap.x, at.y - lastTap.y) < DOUBLE_TAP_PX) {
					lastTap = null
					emit({ kind: 'doubleTap', at })
					return
				}
				lastTap = { ...at, t: now }
				cancelTimer = opts.schedule(() => emit({ kind: 'tap', at, pointer }), TAP_DELAY_MS)
				return
			}
			emit({ kind: 'tap', at, pointer })
		},
		cancel() {
			cancelTimer?.()
			cancelTimer = null
			lastTap = null
		},
	}
}

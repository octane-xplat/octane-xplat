import { frame, writeCell } from './host'

export interface RollTween {
	fromY: number
	toY: number
	fromOpacity: number
	toOpacity: number
	durationMs: number
	delayMs?: number
	onDone?: () => void
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)

/** One bounded translateY/opacity tween on a cell view, driven by the
 *  platform frame clock — no component render per frame. The returned cancel
 *  leaves the view at its last written value; settling belongs to the caller. */
export function playRoll(view: any, spec: RollTween): () => void {
	writeCell(view, spec.fromY, spec.fromOpacity)
	let raf = 0
	let timer: ReturnType<typeof setTimeout> | null = null
	let cancelled = false
	let start = -1

	const finish = () => {
		if (cancelled) {
			return
		}

		cancelled = true
		writeCell(view, spec.toY, spec.toOpacity)
		spec.onDone?.()
	}

	const tick = () => {
		if (cancelled) {
			return
		}

		const now = frame.now()
		if (start < 0) {
			start = now
		}

		const t = Math.min(1, Math.max(0, (now - start) / spec.durationMs))
		const eased = easeOut(t)

		writeCell(
			view,
			spec.fromY + (spec.toY - spec.fromY) * eased,
			spec.fromOpacity + (spec.toOpacity - spec.fromOpacity) * eased,
		)

		if (t >= 1) {
			cancelled = true
			spec.onDone?.()
		} else {
			raf = frame.request(tick)
		}
	}

	const begin = () => {
		if (cancelled) {
			return
		}

		if (spec.durationMs <= 0) {
			finish()
			return
		}

		raf = frame.request(tick)
	}

	const delay = spec.delayMs ?? 0
	if (delay > 0) {
		timer = setTimeout(begin, delay)
	} else {
		begin()
	}

	return () => {
		cancelled = true
		if (timer !== null) {
			clearTimeout(timer)
		}

		frame.cancel(raf)
	}
}

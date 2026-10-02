/** Detent math shared by the web/native sheet-detents attachments.
 *  Detents are viewport-height fractions; the panel is sized to the
 *  largest detent and parked at the translateY offset for the current
 *  one, so a snap is just a transform write — no layout thrash. */

/** Downward/upward finger speed (px/s web, dip/s native) that overrides
 *  nearest-detent snapping — a fling snaps one detent in its direction. */
export const DETENT_FLICK_VELOCITY = 500

/** Sorted, filtered, deduped detent fractions. Empty → the caller keeps
 *  the content-sized sheet behavior (detents off). */
export function normalizeDetents(input?: readonly number[]): number[] {
	if (!input?.length) {
		return []
	}

	return [...new Set(input.filter((d) => d > 0 && d <= 1))].sort((a, b) => a - b)
}

/** One snap point → viewport-height fraction. A number ≤ 1 is already a
 *  fraction; a larger number is px/dips. Strings accept 'NN%' and 'NNpx'
 *  (bare numeric strings are px). Returns null when unresolvable. */
export function snapPointFraction(point: number | string, vh: number): number | null {
	if (typeof point === 'number') {
		if (point <= 0) {
			return null
		}

		return point <= 1 ? point : point / vh
	}

	const trimmed = point.trim()
	const percent = trimmed.match(/^([\d.]+)%$/)
	if (percent) {
		return parseFloat(percent[1]) / 100
	}

	const px = trimmed.match(/^([\d.]+)(?:px)?$/)
	if (px) {
		return parseFloat(px[1]) / vh
	}

	return null
}

/** Astryx `snapPoints` → sorted detent fractions (the existing controller
 *  shape). `vh` is the viewport height in px/dips. Stops larger than the
 *  window clamp to 1. Empty → detents off. */
export function normalizeSnapPoints(
	input: readonly (number | string)[] | undefined,
	vh: number,
): number[] {
	if (!input?.length || !(vh > 0)) {
		return []
	}

	const fractions = input
		.map((point) => snapPointFraction(point, vh))
		.filter((f): f is number => f != null && f > 0)
		.map((f) => Math.min(f, 1))

	return normalizeDetents(fractions)
}

/** Resting translateY for a detent: the panel is `max * vh` tall, so the
 *  portion below the screen edge is `(max - detent) * vh`. */
export function detentOffset(detents: readonly number[], index: number, vh: number): number {
	return (detents[detents.length - 1] - detents[index]) * vh
}

/** Snap target for a release at translateY `ty` with vertical velocity
 *  `vy` (positive = dragging down). Returns the detent index, or -1 to
 *  dismiss: released below half of the smallest detent, or a downward
 *  fling while at/below it. */
export function snapDetentIndex(
	ty: number,
	vy: number,
	detents: readonly number[],
	vh: number,
): number {
	const max = detents[detents.length - 1]
	const frac = Math.min(Math.max(max - ty / vh, 0), 1)

	if (vy > DETENT_FLICK_VELOCITY) {
		// Fling down — the nearest detent strictly below the finger.
		let i = -1
		while (i + 1 < detents.length && detents[i + 1] < frac - 1e-6) {
			i++
		}

		return i
	}

	if (vy < -DETENT_FLICK_VELOCITY) {
		// Fling up — the nearest detent strictly above the finger.
		let i = detents.length - 1
		while (i - 1 >= 0 && detents[i - 1] > frac + 1e-6) {
			i--
		}

		return i
	}

	if (frac < detents[0] * 0.5) {
		return -1
	}

	let best = 0
	for (let i = 1; i < detents.length; i++) {
		if (Math.abs(detents[i] - frac) < Math.abs(detents[best] - frac)) {
			best = i
		}
	}

	return best
}

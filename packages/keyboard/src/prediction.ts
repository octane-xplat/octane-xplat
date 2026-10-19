/** UIKit presentation measurements describe the displayed frame. A property
 * commit made in that display callback appears on the next refresh. Estimate
 * only that bounded interval; current geometry stays a separate measurement.
 * @internal */
export function nextKeyboardPosition(options: {
	current: number
	previous: number
	elapsedMs: number
	nextMs: number
	target: number
	top: number
	bottom: number
}): number {
	const { current, previous, elapsedMs, nextMs, target, top, bottom } = options
	if (
		![current, previous, elapsedMs, nextMs, target, top, bottom].every(Number.isFinite) ||
		elapsedMs <= 0 ||
		elapsedMs > 50 ||
		nextMs <= 0 ||
		nextMs > 34
	) {
		return current
	}
	const velocity = (current - previous) / elapsedMs
	let estimate = current + velocity * nextMs
	// A reversal may continue in the old direction before turning. Preserve
	// that measured direction, but do not overshoot a target being approached.
	if ((target - current) * velocity > 0) {
		estimate = velocity > 0 ? Math.min(target, estimate) : Math.max(target, estimate)
	}
	return Math.max(top, Math.min(bottom, estimate))
}

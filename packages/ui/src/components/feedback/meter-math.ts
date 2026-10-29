/** Clamp a meter value to its declared range for drawing and accessibility. */
export function meterRange(value: number, min: number, max: number) {
	const lo = Number.isFinite(min) ? min : 0
	const hi = Number.isFinite(max) && max > lo ? max : lo + 100
	const safeValue = Number.isFinite(value) ? Math.min(hi, Math.max(lo, value)) : lo
	const range = hi - lo
	return { min: lo, max: hi, value: safeValue, ratio: range === 0 ? 0 : (safeValue - lo) / range }
}

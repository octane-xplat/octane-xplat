/** Clamp a progress value to its declared range for drawing and accessibility. */
export function meterRange(value: number, max: number) {
	const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
	const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
	return { max: safeMax, value: safeValue, ratio: safeValue / safeMax };
}

/** Internal validation shared by the platform leaves. */
export function bounded(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) {
		throw new RangeError('Audio setting must be finite')
	}
	return Math.max(min, Math.min(max, value))
}

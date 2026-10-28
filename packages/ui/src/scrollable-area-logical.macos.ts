/** AppKit clips count x from the left; shared inline offsets count from the
 * writing direction's start. This clamped conversion is its own inverse. */
export function convertAppKitInlineOffset(value: number, maximum: number, direction: 'ltr' | 'rtl'): number {
	const max = Number.isFinite(maximum) ? Math.max(0, maximum) : 0
	const offset = Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0
	return direction === 'rtl' ? max - offset : offset
}

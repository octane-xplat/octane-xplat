type Range = { min: number; max: number; value: number; text: string }

/** GTK's ref facade publishes typed range properties without importing GI in UI. */
export function applySliderAccessibility(view: any, range: Range): void {
	view?.setAccessibilityRange(range)
}

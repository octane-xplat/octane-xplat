type Range = { min: number; max: number; value: number; text: string }

/** NativeScript exposes the adjustable value as text. */
export function applySliderAccessibility(view: any, range: Range): void {
	if (view) view.accessibilityValue = range.text
}

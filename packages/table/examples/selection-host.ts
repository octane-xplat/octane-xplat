export function selectionState(view: any): string {
	return view.accessibilityValue === 'Partially selected' ? 'mixed' : view.accessibilityState
}

export function rowPosition(_row: any, control: any): string {
	return control.accessibilityHint
}

export function scrollBody(view: any, offset: number): void {
	view.scrollToVerticalOffset(offset, false)
}

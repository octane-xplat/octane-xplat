export function selectionState(view: any): string {
	const value = Number(view.accessibilityValue())
	if (view.accessibilityRole() !== 'AXCheckBox') {
		throw new Error('Expected AXCheckBox')
	}

	return value === 2 ? 'mixed' : value === 1 ? 'checked' : 'unchecked'
}

export function rowPosition(_row: any, control: any): string {
	return String(control.accessibilityHelp())
}

export function scrollBody(view: any, offset: number): void {
	view.contentView.scrollToPoint({ x: 0, y: offset })
	view.reflectScrolledClipView(view.contentView)
}

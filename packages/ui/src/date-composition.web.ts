export function hasDateComposition(
	_view: unknown,
	event?: { isComposing?: boolean; keyCode?: number },
): boolean {
	return !!event?.isComposing || event?.keyCode === 229
}

// Describe keys without importing a component package; pickers retain the caller's value types.
type AccessibilityPropValues = {
	accessible?: unknown
	accessibilityRole?: unknown
	accessibilityLabel?: unknown
	accessibilityHint?: unknown
	accessibilityValue?: unknown
	accessibilityState?: unknown
	accessibilityLiveRegion?: unknown
}

/** Forward only accessibility props, without defaults or host conversion. */
export function pickAccessibilityProps<T extends AccessibilityPropValues>(
	props: T,
): Pick<T, keyof T & keyof AccessibilityPropValues> {
	return {
		accessible: props.accessible,
		accessibilityRole: props.accessibilityRole,
		accessibilityLabel: props.accessibilityLabel,
		accessibilityHint: props.accessibilityHint,
		accessibilityValue: props.accessibilityValue,
		accessibilityState: props.accessibilityState,
		accessibilityLiveRegion: props.accessibilityLiveRegion,
	} as Pick<T, keyof T & keyof AccessibilityPropValues>
}

/** Compare the forwarded group with strict equality; object values retain identity semantics. */
export function equalAccessibilityProps(
	a: AccessibilityPropValues,
	b: AccessibilityPropValues,
): boolean {
	return (
		a.accessible === b.accessible &&
		a.accessibilityRole === b.accessibilityRole &&
		a.accessibilityLabel === b.accessibilityLabel &&
		a.accessibilityHint === b.accessibilityHint &&
		a.accessibilityValue === b.accessibilityValue &&
		a.accessibilityState === b.accessibilityState &&
		a.accessibilityLiveRegion === b.accessibilityLiveRegion
	)
}

type LayoutChildPropValues = {
	row?: unknown
	col?: unknown
	rowSpan?: unknown
	colSpan?: unknown
	dock?: unknown
	left?: unknown
	top?: unknown
	flexGrow?: unknown
	flexShrink?: unknown
	alignSelf?: unknown
	order?: unknown
}

/** Forward only parent-layout props, without defaults or host conversion. */
export function pickLayoutChildProps<T extends LayoutChildPropValues>(
	props: T,
): Pick<T, keyof T & keyof LayoutChildPropValues> {
	return {
		row: props.row,
		col: props.col,
		rowSpan: props.rowSpan,
		colSpan: props.colSpan,
		dock: props.dock,
		left: props.left,
		top: props.top,
		flexGrow: props.flexGrow,
		flexShrink: props.flexShrink,
		alignSelf: props.alignSelf,
		order: props.order,
	} as Pick<T, keyof T & keyof LayoutChildPropValues>
}

/** Compare the forwarded group with strict equality; object values retain identity semantics. */
export function equalLayoutChildProps(a: LayoutChildPropValues, b: LayoutChildPropValues): boolean {
	return (
		a.row === b.row &&
		a.col === b.col &&
		a.rowSpan === b.rowSpan &&
		a.colSpan === b.colSpan &&
		a.dock === b.dock &&
		a.left === b.left &&
		a.top === b.top &&
		a.flexGrow === b.flexGrow &&
		a.flexShrink === b.flexShrink &&
		a.alignSelf === b.alignSelf &&
		a.order === b.order
	)
}

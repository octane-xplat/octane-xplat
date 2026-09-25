import type { LayoutChildProps, FlexContainerProps } from './props'

/** The shared contract is "numbers are dips" (RN semantics), but octane's DOM
 *  renderer keeps React's unitless list — lineHeight is unitless there, so
 *  `style={{lineHeight: 40}}` would render a 40× multiplier instead of 40px.
 *  lineHeight is the one unitless-in-React prop that is a length in the
 *  shared vocabulary; force the px suffix. */
export function normStyle(style: any) {
	if (style && typeof style.lineHeight === 'number') {
		return { ...style, lineHeight: style.lineHeight + 'px' }
	}
	return style
}

// start/end shorthand → flex-start/flex-end (valid in both engines).
const FLEX_JUSTIFY: Record<string, string> = {
	start: 'flex-start',
	end: 'flex-end',
}
const FLEX_ALIGN: Record<string, string> = {
	start: 'flex-start',
	end: 'flex-end',
}

/** Convert parent-layout metadata to CSS on the web leaf. Native's `dock`
 *  attribute has no CSS equivalent and is ignored on web. Grid indices are
 *  zero-based in the shared API, matching NativeScript. */
export function layoutChildProps(
	props: LayoutChildProps & Partial<FlexContainerProps> & { style?: any },
	baseStyle = props.style,
) {
	const style = { ...normStyle(baseStyle) }
	if (props.row !== undefined) style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`
	else if (props.rowSpan !== undefined) style.gridRow = `span ${props.rowSpan}`

	if (props.col !== undefined) style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`
	else if (props.colSpan !== undefined) style.gridColumn = `span ${props.colSpan}`

	if (props.left !== undefined) style.left = props.left
	if (props.top !== undefined) style.top = props.top
	if (props.flexGrow !== undefined) style.flexGrow = props.flexGrow
	if (props.flexShrink !== undefined) style.flexShrink = props.flexShrink
	if (props.alignSelf !== undefined) style.alignSelf = props.alignSelf
	if (props.order !== undefined) style.order = props.order

	// Flex-container props (View/Row/Pressable hosts) — RN vocabulary on the
	// element style. Numbers become px via octane's style normalization.
	if (props.justifyContent !== undefined)
		style.justifyContent = FLEX_JUSTIFY[props.justifyContent] ?? props.justifyContent
	if (props.alignItems !== undefined)
		style.alignItems = FLEX_ALIGN[props.alignItems] ?? props.alignItems
	if (props.flexWrap !== undefined)
		style.flexWrap =
			props.flexWrap === true ? 'wrap' : props.flexWrap === false ? 'nowrap' : props.flexWrap
	if (props.gap !== undefined) style.gap = props.gap
	if (props.rowGap !== undefined) style.rowGap = props.rowGap
	if (props.columnGap !== undefined) style.columnGap = props.columnGap

	// The shared contract is "numbers are dips" (RN semantics), but octane's
	// DOM renderer keeps React's unitless list — lineHeight is unitless there,
	// so `style={{lineHeight: 40}}` would render a 40× multiplier instead of
	// 40px. lineHeight is the one unitless-in-React prop that is a length in
	// the shared vocabulary; force the px suffix.
	if (typeof style.lineHeight === 'number') style.lineHeight = style.lineHeight + 'px'
	return { style }
}

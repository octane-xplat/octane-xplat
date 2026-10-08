import type { FlexContainerProps, LayoutChildProps, SmoothCornersProps } from './props'

// start/end shorthand → flex-start/flex-end (NativeScript's value names; the
// AppKit renderer accepts both forms).
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', end: 'flex-end' }
const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end' }

// The element's box geometry — parent layouts read the child's own style for
// size and margins, so these keys must land on the outer wrapper. The rest
// of `style` stays on the inner box (it is the clipped, painted surface).
const OUTER_STYLE_KEYS = [
	'width',
	'height',
	'margin',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
] as const

const MARGIN_KEYS = [
	'margin',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
] as const

/** The inner box's `style` — everything except margins, which belong to the
 *  element's border box and move out to the wrapper. Width/height stay: the
 *  AppKit inner stack cannot stretch along its parent's main axis, so it
 *  must keep its own size. */
export function paintedStyle(style: any) {
	if (!style || typeof style !== 'object') {
		return style
	}

	const next = { ...style }
	for (const key of MARGIN_KEYS) {
		delete next[key]
	}

	return next
}

/** Parent-layout metadata — must land on the OUTER wrapper, the node the
 *  parent layout reads as its child. Values forward under the host's own
 *  attribute names. */
export function outerLayoutProps(props: LayoutChildProps & { style?: any }) {
	const result: Record<string, any> = {}
	for (const key of [
		'row',
		'col',
		'rowSpan',
		'colSpan',
		'dock',
		'left',
		'top',
		'right',
		'bottom',
		'horizontalAlignment',
		'verticalAlignment',
		'flexGrow',
		'flexShrink',
		'alignSelf',
		'order',
	] as const) {
		if (props[key] !== undefined) {
			result[key] = props[key]
		}
	}

	if (props.style && typeof props.style === 'object') {
		const style: Record<string, any> = {}
		for (const key of OUTER_STYLE_KEYS) {
			if (props.style[key] !== undefined) {
				style[key] = props.style[key]
			}
		}

		if (Object.keys(style).length > 0) {
			result.style = style
		}
	}

	return result
}

/** Flex-container props — land on the INNER host that owns the children.
 *  Used by the macOS leaf (inner flexboxlayout); the native leaf's inner
 *  gridlayout has no flex vocabulary and does not consume these. */
export function innerLayoutProps(
	props: FlexContainerProps & Pick<SmoothCornersProps, 'flexDirection'>,
) {
	const result: Record<string, any> = {}
	if (props.flexDirection !== undefined) {
		result.flexDirection = props.flexDirection
	}

	if (props.justifyContent !== undefined) {
		result.justifyContent = FLEX_JUSTIFY[props.justifyContent] ?? props.justifyContent
	}

	if (props.alignItems !== undefined) {
		result.alignItems = FLEX_ALIGN[props.alignItems] ?? props.alignItems
	}

	if (props.flexWrap !== undefined) {
		result.flexWrap =
			props.flexWrap === true ? 'wrap' : props.flexWrap === false ? 'nowrap' : props.flexWrap
	}

	if (props.gap !== undefined) {
		result.gap = props.gap
	}

	if (props.rowGap !== undefined) {
		result.rowGap = props.rowGap
	}

	if (props.columnGap !== undefined) {
		result.columnGap = props.columnGap
	}

	return result
}

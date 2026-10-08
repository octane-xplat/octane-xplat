import type { FlexContainerProps, LayoutChildProps, SmoothCornersProps } from './props'

// start/end shorthand → flex-start/flex-end (valid in both engines).
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', end: 'flex-end' }
const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end' }

// Grid-cell alignment vocabulary → CSS self-alignment.
const JUSTIFY_SELF: Record<string, string> = {
	left: 'start',
	center: 'center',
	middle: 'center',
	right: 'end',
	stretch: 'stretch',
}

const ALIGN_SELF: Record<string, string> = {
	top: 'start',
	center: 'center',
	middle: 'center',
	bottom: 'end',
	stretch: 'stretch',
}

// The element's box geometry — belongs on the outermost element so parent
// layouts size the whole component, not the clipped box inside it.
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
 *  element's border box and move out to the wrapper. */
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

/** Parent-layout metadata folded into CSS on the outermost element — the
 *  shadow wrapper when present, the clipped box otherwise. Native's `dock`
 *  has no CSS equivalent and is ignored on web. Grid indices are zero-based
 *  in the shared API, matching NativeScript. */
export function outerLayoutProps(props: LayoutChildProps & { style?: any }) {
	const style: Record<string, any> = {}
	if (props.row !== undefined) {
		style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`
	} else if (props.rowSpan !== undefined) {
		style.gridRow = `span ${props.rowSpan}`
	}

	if (props.col !== undefined) {
		style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`
	} else if (props.colSpan !== undefined) {
		style.gridColumn = `span ${props.colSpan}`
	}

	for (const key of ['left', 'top', 'right', 'bottom'] as const) {
		if (props[key] !== undefined) {
			style[key] = props[key]
		}
	}

	if (props.flexGrow !== undefined) {
		style.flexGrow = props.flexGrow
	}

	if (props.flexShrink !== undefined) {
		style.flexShrink = props.flexShrink
	}

	if (props.alignSelf !== undefined) {
		style.alignSelf = props.alignSelf
	}

	if (props.order !== undefined) {
		style.order = props.order
	}

	if (props.horizontalAlignment !== undefined) {
		style.justifySelf = JUSTIFY_SELF[props.horizontalAlignment] ?? props.horizontalAlignment
	}

	// CSS align-self is shared by flex and grid children — the grid-specific
	// prop wins when both are set.
	if (props.verticalAlignment !== undefined) {
		style.alignSelf = ALIGN_SELF[props.verticalAlignment] ?? props.verticalAlignment
	}

	if (props.style && typeof props.style === 'object') {
		for (const key of OUTER_STYLE_KEYS) {
			if (props.style[key] !== undefined) {
				style[key] = props.style[key]
			}
		}
	}

	return { style }
}

/** Flex-container props folded into the inner box's style. Emits
 *  `display: flex` only when a flex prop is present so a bare SmoothCorners
 *  keeps normal block flow; the default direction is column to match the
 *  renderers' stack default. */
export function innerLayoutProps(
	props: FlexContainerProps & Pick<SmoothCornersProps, 'flexDirection'>,
) {
	const hasFlex =
		props.flexDirection !== undefined ||
		props.justifyContent !== undefined ||
		props.alignItems !== undefined ||
		props.flexWrap !== undefined ||
		props.gap !== undefined ||
		props.rowGap !== undefined ||
		props.columnGap !== undefined

	if (!hasFlex) {
		return { style: {} }
	}

	const style: Record<string, any> = {
		display: 'flex',
		flexDirection: props.flexDirection ?? 'column',
	}

	if (props.justifyContent !== undefined) {
		style.justifyContent = FLEX_JUSTIFY[props.justifyContent] ?? props.justifyContent
	}

	if (props.alignItems !== undefined) {
		style.alignItems = FLEX_ALIGN[props.alignItems] ?? props.alignItems
	}

	if (props.flexWrap !== undefined) {
		style.flexWrap =
			props.flexWrap === true ? 'wrap' : props.flexWrap === false ? 'nowrap' : props.flexWrap
	}

	if (props.gap !== undefined) {
		style.gap = props.gap
	}

	if (props.rowGap !== undefined) {
		style.rowGap = props.rowGap
	}

	if (props.columnGap !== undefined) {
		style.columnGap = props.columnGap
	}

	return { style }
}

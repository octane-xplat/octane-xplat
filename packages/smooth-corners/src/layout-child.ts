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

const MARGIN_KEYS = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const

/** The inner box's `style` — everything except margins, which belong to the
 *  element's border box and move out to the wrapper. Width/height stay: the
 *  AppKit inner stack cannot stretch along its parent's main axis, so it
 *  must keep its own size. */
export function paintedStyle(style: any): any {
	if (!style || typeof style !== 'object') {
		return style
	}

	const next = { ...style }
	for (const key of MARGIN_KEYS) {
		delete next[key]
	}

	return next
}

/** Parent-layout metadata translated to CSS on the OUTER wrapper — the node
 *  the parent layout reads as its child. Placement sugar compiles to the
 *  same style keys as the shared layout-child helper; the box-geometry
 *  keys (size/margins) mirror out of `style` since parent layouts read the
 *  child's own box. */
export function outerLayoutProps(props: LayoutChildProps & { style?: any }): {
	style: Record<string, any>
} {
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
	if (props.dock !== undefined) {
		style.position = 'absolute'
		if (props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom') {
			style.left = 0
		}

		if (props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom') {
			style.right = 0
		}

		if (props.dock === 'top' || props.dock === 'left' || props.dock === 'right') {
			style.top = 0
		}

		if (props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right') {
			style.bottom = 0
		}
	}
	if (props.left !== undefined) {
		style.left = props.left
		style.position = style.position ?? 'absolute'
	}
	if (props.top !== undefined) {
		style.top = props.top
		style.position = style.position ?? 'absolute'
	}
	for (const key of ['flexGrow', 'flexShrink', 'alignSelf', 'order'] as const) {
		if (props[key] !== undefined) {
			style[key] = props[key]
		}
	}

	const source = props.style && typeof props.style === 'object' ? props.style : {}
	for (const key of OUTER_STYLE_KEYS) {
		if (source[key] !== undefined) {
			style[key] = source[key]
		}
	}

	return { style }
}

/** Flex-container props — the INNER host's CSS layout style. Used by the
 *  macOS leaf (inner masonview); shared Stack-style props compile to the
 *  same style keys as on web. */
export function innerLayoutProps(
	props: FlexContainerProps & Pick<SmoothCornersProps, 'flexDirection'>,
): {
	style: Record<string, any>
} {
	const style: Record<string, any> = {}
	if (props.flexDirection !== undefined) {
		style.flexDirection = props.flexDirection
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

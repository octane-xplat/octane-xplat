import type { LayoutChildProps, FlexContainerProps } from './props'
import { mergeStyle } from './style-merge'

// start/end shorthand → flex-start/flex-end.
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', end: 'flex-end' }
const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end' }

/** Convert parent-layout metadata + the flex-container contract to the CSS
 *  style bag on the host masonview — mirrors layout-child.web.ts so the same
 *  component props compile to the same CSS on both targets. `dock` has no
 *  CSS equivalent on web (ignored there); on native it becomes absolute
 *  insets. Native adds `position: absolute` for edge-placed children since
 *  there is no `.vx-absolute > *` stylesheet rule on the mason engine. */
export function layoutChildProps(
	props: LayoutChildProps & Partial<FlexContainerProps> & { style?: any },
	baseStyle = props.style,
) {
	const style: Record<string, any> = { ...(typeof baseStyle === 'object' ? baseStyle : {}) }
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
		style.position = style.position ?? 'absolute'
		if (props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom') {
			style.left = style.left ?? 0
		}

		if (props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom') {
			style.right = style.right ?? 0
		}

		if (props.dock === 'top' || props.dock === 'left' || props.dock === 'right') {
			style.top = style.top ?? 0
		}

		if (props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right') {
			style.bottom = style.bottom ?? 0
		}
	}

	if (props.left !== undefined) {
		style.left = props.left
	}
	if (props.top !== undefined) {
		style.top = props.top
	}
	if ((props.left !== undefined || props.top !== undefined) && props.dock === undefined) {
		style.position = style.position ?? 'absolute'
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

	// Flex-container props (View/Row/Pressable hosts) — RN vocabulary on the
	// element style.
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

	// A string base is inline CSS — serialize the emitted keys under it so the
	// authored declarations still win.
	return { style: typeof baseStyle === 'string' ? mergeStyle(style, baseStyle) : style }
}

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

// Whitelisted by the AppKit flexboxlayout prop handler — safe to emit even
// as `undefined`, which is how removals propagate: the hosts merge update
// bags over the node's recorded props, so a vanished key would keep its
// stale value and parent layouts would never see the removal.
const CHILD_PROPS_ALWAYS = [
	'row',
	'col',
	'rowSpan',
	'colSpan',
	'left',
	'top',
	'horizontalAlignment',
	'verticalAlignment',
	'flexGrow',
	'flexShrink',
	'alignSelf',
	'order',
] as const

// Not whitelisted on the AppKit host (the prop-warning gap, GH#9/#10) —
// emitted only when set so a bare SmoothCorners does not warn every mount.
const CHILD_PROPS_IF_SET = ['dock', 'right', 'bottom'] as const

/** Parent-layout metadata — must land on the OUTER wrapper, the node the
 *  parent layout reads as its child. Values forward under the host's own
 *  attribute names. */
export function outerLayoutProps(props: LayoutChildProps & { style?: any }) {
	const result: Record<string, any> = {}
	for (const key of CHILD_PROPS_ALWAYS) {
		result[key] = props[key]
	}

	for (const key of CHILD_PROPS_IF_SET) {
		if (props[key] !== undefined) {
			result[key] = props[key]
		}
	}

	const source = props.style && typeof props.style === 'object' ? props.style : {}
	const style: Record<string, any> = {}
	for (const key of OUTER_STYLE_KEYS) {
		if (source[key] !== undefined) {
			style[key] = source[key]
		}
	}

	// Explicit undefined clears a previously mirrored geometry bag on update.
	result.style = Object.keys(style).length > 0 ? style : undefined
	return result
}

/** Flex-container props — land on the INNER host that owns the children.
 *  Used by the macOS leaf (inner flexboxlayout); the native leaf's inner
 *  gridlayout has no flex vocabulary and does not consume these. */
export function innerLayoutProps(
	props: FlexContainerProps & Pick<SmoothCornersProps, 'flexDirection'>,
) {
	const result: Record<string, any> = {}
	// Explicit undefined so removals propagate through the merge-style update.
	result.flexDirection = props.flexDirection
	result.justifyContent =
		props.justifyContent === undefined
			? undefined
			: (FLEX_JUSTIFY[props.justifyContent] ?? props.justifyContent)

	result.alignItems =
		props.alignItems === undefined
			? undefined
			: (FLEX_ALIGN[props.alignItems] ?? props.alignItems)

	result.flexWrap =
		props.flexWrap === undefined
			? undefined
			: props.flexWrap === true
				? 'wrap'
				: props.flexWrap === false
					? 'nowrap'
					: props.flexWrap

	result.gap = props.gap
	// rowGap/columnGap have no AppKit stack equivalent and are not whitelisted
	// — emit only when set, matching the child-prop treatment above.
	if (props.rowGap !== undefined) {
		result.rowGap = props.rowGap
	}

	if (props.columnGap !== undefined) {
		result.columnGap = props.columnGap
	}

	return result
}

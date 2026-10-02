import type {
	StackPaddingProps,
	StackProps,
	StackItemProps,
	StackMainAlignment,
	StackCrossAlignment,
} from './props'

/** Astryx spacing step → dips (step × 4, matching the upstream
 *  `--spacing-N` scale: 0.5→2, 1→4, 2→8, 3→12, 4→16, …, 10→40). */
export function spacingPx(step: number | undefined | null): number | undefined {
	return step == null ? undefined : step * 4
}

const JUSTIFY: Record<StackMainAlignment, string> = {
	start: 'flex-start',
	center: 'center',
	end: 'flex-end',
	between: 'space-between',
	around: 'space-around',
	evenly: 'space-evenly',
}

const ALIGN: Record<StackCrossAlignment, string> = {
	start: 'flex-start',
	center: 'center',
	end: 'flex-end',
	stretch: 'stretch',
}

const ALIGN_SELF: Record<string, string> = {
	start: 'flex-start',
	end: 'flex-end',
}

export interface ResolvedStackLayout {
	/** 'row' | 'column' — the flex-direction value both engines share. */
	flexDirection: 'row' | 'column'
	justifyContent?: string
	alignItems?: string
	flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
	gap?: number
	scrollable: boolean
	/** Resolved per-edge padding in dips (edge → axis → padding precedence). */
	paddingTop?: number
	paddingRight?: number
	paddingBottom?: number
	paddingLeft?: number
	/** Logical variants for web's inline/block-aware styles. */
	paddingInlineStart?: number
	paddingInlineEnd?: number
	paddingBlockStart?: number
	paddingBlockEnd?: number
}

/** Resolve Stack's directional alignment + spacing props into flex values.
 *  `hAlign`/`vAlign` follow the physical axes; `justify`/`align` alias the
 *  main/cross axes of the active direction. */
export function resolveStackLayout(props: StackProps): ResolvedStackLayout {
	const direction = props.direction ?? 'vertical'
	const horizontal = direction === 'horizontal'

	const resolvedHAlign = props.hAlign ?? (horizontal ? props.justify : props.align)
	const resolvedVAlign = props.vAlign ?? (horizontal ? props.align : props.justify)

	const main = horizontal ? resolvedHAlign : resolvedVAlign
	const cross = horizontal ? resolvedVAlign : resolvedHAlign

	const paddingInlineStart = spacingPx(
		props.paddingInlineStart ?? props.paddingInline ?? props.padding,
	)
	const paddingInlineEnd = spacingPx(props.paddingInlineEnd ?? props.paddingInline ?? props.padding)
	const paddingBlockStart = spacingPx(
		props.paddingBlockStart ?? props.paddingBlock ?? props.padding,
	)
	const paddingBlockEnd = spacingPx(props.paddingBlockEnd ?? props.paddingBlock ?? props.padding)

	return {
		flexDirection: horizontal ? 'row' : 'column',
		justifyContent:
			main != null ? (JUSTIFY[main as StackMainAlignment] ?? (main as string)) : undefined,
		alignItems:
			cross != null ? (ALIGN[cross as StackCrossAlignment] ?? (cross as string)) : undefined,
		flexWrap: props.wrap != null && props.wrap !== 'nowrap' ? props.wrap : undefined,
		gap: spacingPx(props.gap),
		scrollable: props.isScrollable === true,
		paddingTop: paddingBlockStart,
		paddingBottom: paddingBlockEnd,
		paddingLeft: paddingInlineStart,
		paddingRight: paddingInlineEnd,
		paddingInlineStart,
		paddingInlineEnd,
		paddingBlockStart,
		paddingBlockEnd,
	}
}

/** The web `style` fragment for a resolved stack (logical padding +
 *  px-unit sizing — octane renders numbers as px for length props). */
export function stackWebStyle(
	layout: ResolvedStackLayout,
	props: StackSizeLike,
): Record<string, any> {
	const style: Record<string, any> = {}
	if (layout.gap !== undefined) {
		style.gap = layout.gap
	}
	if (layout.flexWrap !== undefined) {
		style.flexWrap = layout.flexWrap
	}
	if (layout.paddingInlineStart !== undefined) {
		style.paddingInlineStart = layout.paddingInlineStart
	}
	if (layout.paddingInlineEnd !== undefined) {
		style.paddingInlineEnd = layout.paddingInlineEnd
	}
	if (layout.paddingBlockStart !== undefined) {
		style.paddingBlockStart = layout.paddingBlockStart
	}
	if (layout.paddingBlockEnd !== undefined) {
		style.paddingBlockEnd = layout.paddingBlockEnd
	}
	if (layout.scrollable) {
		style.overflow = 'auto'
	}
	if (props.width != null) {
		style.width = props.width
	}
	if (props.height != null) {
		style.height = props.height
	}
	if (props.maxWidth != null) {
		style.maxWidth = props.maxWidth
	}
	if (props.minHeight != null) {
		style.minHeight = props.minHeight
	}
	return style
}

export interface StackSizeLike {
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	minHeight?: number | string
}

/** The style fragment for StackItem — `fill` grows (and is allowed to
 *  shrink) into remaining space; the min-size reset lets it become a
 *  scroll region under a flex parent. */
export function stackItemStyle(props: StackItemProps): Record<string, any> {
	const style: Record<string, any> = {}
	if (props.size === 'fill') {
		style.flexGrow = 1
		style.flexShrink = 1
	} else {
		style.flexGrow = 0
		style.flexShrink = 0
	}

	if (props.crossAlignSelf != null) {
		style.alignSelf = ALIGN_SELF[props.crossAlignSelf] ?? props.crossAlignSelf
	}

	if (props.isScrollable) {
		style.overflow = 'auto'
	}
	return style
}

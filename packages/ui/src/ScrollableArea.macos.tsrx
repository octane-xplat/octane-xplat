/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useImperativeHandle, useMemo, useRef } from 'octane'
import type { ScrollableAreaHandle, ScrollableAreaProps } from './props'
import { layoutChildProps } from './layout-child'
import { spacingStep } from './spacing'
import { useScrollableArea } from './use-scrollable-area.macos.tsrx'

/** Scrolls the AppKit viewport to logical-axis offsets. The clip origin's x
 * is already the inline offset; block offsets count top-down, so a
 * non-flipped document converts through the document height. */
function scrollToOffsets(
	scroll: any,
	offset: { inline?: number; block?: number },
	animated: boolean,
) {
	const clip = scroll?.contentView
	if (!clip) {
		return
	}

	const doc = scroll?.documentView
	const bounds = clip.bounds
	const docWidth = Number(doc?.frame?.size?.width ?? 0)
	const docHeight = Number(doc?.frame?.size?.height ?? 0)
	const clipWidth = Number(bounds?.size?.width ?? 0)
	const clipHeight = Number(bounds?.size?.height ?? 0)
	const flip = typeof doc?.isFlipped === 'function' ? doc.isFlipped() : doc?.isFlipped
	const flipped = flip === true || Number(flip) === 1
	const x =
		offset.inline == null || !Number.isFinite(offset.inline)
			? Number(bounds?.origin?.x ?? 0)
			: Math.max(0, Math.min(offset.inline, Math.max(0, docWidth - clipWidth)))

	let y = Number(bounds?.origin?.y ?? 0)
	if (offset.block != null && Number.isFinite(offset.block)) {
		const top = Math.max(0, Math.min(offset.block, Math.max(0, docHeight - clipHeight)))
		y = flipped ? top : docHeight - clipHeight - top
	}

	// NSClipView.scrollToPoint is animatable through the animator proxy;
	// fall back to an instant write when the bridge cannot vend one.
	const target = animated && typeof clip.animator === 'function' ? clip.animator() : clip
	target.scrollToPoint({ x, y })
	scroll.reflectScrolledClipView(clip)
}

function scrollableAreaHandle(viewport: { current: any }): ScrollableAreaHandle {
	return {
		scrollToOffset: (offset, options) =>
			scrollToOffsets(viewport.current, offset, options?.animated === true),
		get native() {
			return viewport.current
		},
	}
}

/** AppKit viewport. Pull-to-refresh remains unsupported; apps own a refresh
 * action outside the scrolling content. */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const area = useScrollableArea({ axis: props.axis })
	const horizontal = props.axis === 'inline'
	const padding = spacingStep(props.padding)

	const viewport = useRef<any>(null)
	const handle = useMemo(() => scrollableAreaHandle(viewport), [])
	useImperativeHandle(props.ref, () => handle, [props.ref])

	<scrollview
		{...area.getViewportProps({ ref: viewport })}
		{...layoutChildProps(
			props,
			mergeStyle(
				{
					width: props.width,
					height: props.height,
					maxWidth: props.maxWidth,
					minHeight: props.minHeight,
				},
				props.style,
			),
		)}
		id={props.id}
		className={props.className}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<masonview
			{...area.getContentProps()}
			style={mergeStyle(
				{ flexDirection: horizontal ? 'row' : 'column' },
				mergeStyle(
					{ display: 'flex' },
					{
						paddingTop:
							spacingStep(props.paddingBlockStart) ??
							spacingStep(props.paddingBlock) ??
							padding ??
							0,
						paddingBottom:
							spacingStep(props.paddingBlockEnd) ?? spacingStep(props.paddingBlock) ?? padding ?? 0,
						paddingLeft:
							spacingStep(props.paddingInlineStart) ??
							spacingStep(props.paddingInline) ??
							padding ??
							0,
						paddingRight:
							spacingStep(props.paddingInlineEnd) ??
							spacingStep(props.paddingInline) ??
							padding ??
							0,
					},
				),
			)}
		>
			{props.children}
		</masonview>
	</scrollview>
}

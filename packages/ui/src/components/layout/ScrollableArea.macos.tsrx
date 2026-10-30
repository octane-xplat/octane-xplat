/** @jsxImportSource @octane-xplat/jsx */
import type { NSScrollView } from '@octane-xplat/platform/macos'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useImperativeHandle, useMemo, useRef } from 'octane'
import type { ScrollableAreaHandle, ScrollableAreaProps } from '../../props'
import { layoutChildProps } from './layout-child'
import { spacingStep } from './spacing'
import { cx } from '@octane-xplat/lib'
import { useDirection } from '../../internal/platform/internationalization'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'
import { convertAppKitInlineOffset } from './scrollable-area-logical.macos'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'
import { useScrollableArea } from './use-scrollable-area.macos.tsrx'

function scrollableAreaHandle(
	viewport: { current: NSScrollView | null },
	direction: () => 'ltr' | 'rtl',
): ScrollableAreaHandle {
	return {
		scrollToOffset: (offset, options) => {
			const inline = Number.isFinite(offset.inline)
				? convertAppKitInlineOffset(
						offset.inline!,
						scrollableAreaMetrics(viewport.current).maxX,
						direction(),
					)
				: offset.inline

			scrollableAreaOffset(viewport.current, { ...offset, inline }, options?.animated === true)
		},
		get native() {
			// The owning public ref is delivered only for a mounted viewport.
			return viewport.current!
		},
	}
}

/** AppKit viewport. Pull-to-refresh remains unsupported; apps own a refresh
 * action outside the scrolling content. */
export function ScrollableArea(props: ScrollableAreaProps): unknown @{
	const area = useScrollableArea({ axis: props.axis })
	const direction = useDirection(),
		liveDirection = useRef(direction)

	liveDirection.current = direction
	const rtl = direction === 'rtl'
	const horizontal = props.axis === 'inline'
	const padding = spacingStep(props.padding)

	const viewport = useRef<NSScrollView | null>(null)
	const handle = useMemo(() => scrollableAreaHandle(viewport, () => liveDirection.current), [])
	useImperativeHandle(props.ref, () => handle, [props.ref])

	const viewportProps = area.getViewportProps({ ref: viewport })
	const contentProps = area.getContentProps()

	<scrollview
		ref={viewportProps.ref}
		onScroll={viewportProps.onScroll}
		onLayoutChanged={viewportProps.onLayoutChanged}
		orientation={viewportProps.orientation}
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
		testID={props.testID}
		className={cx(props.className)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
	>
		<masonview
			ref={contentProps.ref}
			onLayoutChanged={contentProps.onLayoutChanged}
			className={contentProps.className}
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
							spacingStep(rtl ? props.paddingInlineEnd : props.paddingInlineStart) ??
							spacingStep(props.paddingInline) ??
							padding ??
							0,
						paddingRight:
							spacingStep(rtl ? props.paddingInlineStart : props.paddingInlineEnd) ??
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

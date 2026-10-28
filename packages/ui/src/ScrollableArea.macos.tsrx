/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useImperativeHandle, useMemo, useRef } from 'octane'
import type { ScrollableAreaHandle, ScrollableAreaProps } from './props'
import { layoutChildProps } from './layout-child'
import { spacingStep } from './spacing'
import { cx } from '@octane-xplat/lib'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'
import { useScrollableArea } from './use-scrollable-area.macos.tsrx'

function scrollableAreaHandle(viewport: { current: any }): ScrollableAreaHandle {
	return {
		scrollToOffset: (offset, options) =>
			scrollableAreaOffset(viewport.current, offset, options?.animated === true),
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
		className={cx(props.className)}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
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

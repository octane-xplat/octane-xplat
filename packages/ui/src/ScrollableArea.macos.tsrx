/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ScrollableAreaProps } from './props'
import { layoutChildProps } from './layout-child'
import { spacingStep } from './spacing'
import { useScrollableArea } from './use-scrollable-area.macos.tsrx'

/** AppKit viewport. Pull-to-refresh remains unsupported; apps own a refresh
 * action outside the scrolling content. */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const area = useScrollableArea({ axis: props.axis })
	const horizontal = props.axis === 'inline'
	const padding = spacingStep(props.padding)

	<scrollview
		{...area.getViewportProps({ ref: props.ref })}
		{...layoutChildProps(props)}
		id={props.id}
		className={props.className}
		style={{
			width: props.width,
			height: props.height,
			maxWidth: props.maxWidth,
			minHeight: props.minHeight,
			...props.style,
		}}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<flexboxlayout
			{...area.getContentProps()}
			flexDirection={horizontal ? 'row' : 'column'}
			style={{
				paddingTop: spacingStep(props.paddingBlockStart) ?? spacingStep(props.paddingBlock) ?? padding ?? 0,
				paddingBottom: spacingStep(props.paddingBlockEnd) ?? spacingStep(props.paddingBlock) ?? padding ?? 0,
				paddingLeft: spacingStep(props.paddingInlineStart) ?? spacingStep(props.paddingInline) ?? padding ?? 0,
				paddingRight: spacingStep(props.paddingInlineEnd) ?? spacingStep(props.paddingInline) ?? padding ?? 0,
			}}
		>{props.children}</flexboxlayout>
	</scrollview>
}

/** @jsxImportSource @xplat/macos/renderer */
import type { ScrollableAreaProps } from './props'

/** AppKit NSScrollView leaf. `axis` maps the same way as on NativeScript;
 *  `axis: 'both'` isn't supported by the AppKit leaf — the scroller
 *  follows the block axis there (documented deviation). Pull-to-refresh
 *  props are ignored on macOS. */
export function ScrollableArea(props: ScrollableAreaProps) @{
	const horizontal = props.axis === 'inline';

	<scrollview
		id={props.id}
		className={props.className}
		style={props.style}
		horizontal={horizontal as any}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<flexboxlayout flexDirection={horizontal ? 'row' : 'column'}>{props.children}</flexboxlayout>
	</scrollview>
}

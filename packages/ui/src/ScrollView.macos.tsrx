/** @jsxImportSource @xplat/macos/renderer */
import type { ScrollViewProps } from './props'

export function ScrollView(props: ScrollViewProps) @{
	<scrollview id={props.id} className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel}>
		<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
	</scrollview>
}

export const ScrollBox = ScrollView

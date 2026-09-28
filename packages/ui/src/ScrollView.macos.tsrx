/** @jsxImportSource @xplat/macos/renderer */
import type { ScrollViewProps } from './props'

type AppKitScrollEvent = { verticalOffset: number; viewportHeight: number; contentHeight: number }
type AppKitScrollViewProps = ScrollViewProps & { onScroll?: (event: AppKitScrollEvent) => void }

export function ScrollView(props: AppKitScrollViewProps) @{
	<scrollview
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
		onScroll={props.onScroll}
	>
		<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
	</scrollview>
}

export const ScrollBox = ScrollView

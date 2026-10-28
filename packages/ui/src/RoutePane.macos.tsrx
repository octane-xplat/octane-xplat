/** @jsxImportSource @octane-xplat/jsx */
// Keep inactive viewports measured: display:none collapses NSScrollView's
// document and AppKit clamps its retained offset to zero. Hidden absolute panes
// leave the active layout flow while preserving their viewport geometry.
import { View } from './View'
import { RouterFlowVisibilityContext } from './router-hook-context'
const Visibility: any = RouterFlowVisibilityContext
import type { RoutePaneProps } from './props'

export function RoutePane(props: RoutePaneProps): any {
	return (
		<Visibility value={props.active}>
			<View
				ref={(view: any) => {
					if (view) {
						view.hidden = !props.active
					}

					props.viewRef?.(view)
				}}
				style={
					props.active
						? { display: 'flex', flexGrow: 1 }
						: { display: 'flex', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }
				}
			>
				{props.children}
			</View>
		</Visibility>
	)
}

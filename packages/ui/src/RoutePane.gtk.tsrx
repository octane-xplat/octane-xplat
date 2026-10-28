/** @jsxImportSource @octane-xplat/jsx */
// Native GTK uses an owned widget shell without NativeScript gesture adapters.
import { RouterFlowVisibilityContext } from './router-hook-context'
import type { RoutePaneProps } from './props'
const Visibility: any = RouterFlowVisibilityContext

export function RoutePane(props: RoutePaneProps): any {
	return (
		<Visibility value={props.active}>
			<masonview
				visibility={props.active ? 'visible' : 'collapse'}
				ref={props.viewRef}
				style={{ display: props.active ? 'flex' : 'none', flexGrow: 1 }}
			>
				{props.children}
			</masonview>
		</Visibility>
	)
}

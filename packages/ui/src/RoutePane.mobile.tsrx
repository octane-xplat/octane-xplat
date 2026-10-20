/** @jsxImportSource @nativescript-community/octane */
// The masonview wrapper is a NativeScript View — the router owns it as the SDK
// Animation target while retained panes keep their measured/hidden state.
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

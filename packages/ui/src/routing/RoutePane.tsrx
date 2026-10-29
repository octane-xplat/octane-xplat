// Renderer-neutral composition; native Mason and browser CSS own visibility.
import { View } from '../components/layout/View'
import { RouterFlowVisibilityContext } from './router-hook-context'
const Visibility: any = RouterFlowVisibilityContext
import type { RoutePaneProps } from '../props'

export function RoutePane(props: RoutePaneProps): any {
	return (
		<Visibility value={props.active}>
			<View ref={props.viewRef} style={{ display: props.active ? 'flex' : 'none', flexGrow: 1 }}>
				{props.children}
			</View>
		</Visibility>
	)
}

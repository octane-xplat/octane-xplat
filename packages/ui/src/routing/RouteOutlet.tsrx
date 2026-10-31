/** @jsxImportSource @octane-xplat/jsx */
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { useRouteOutletScope } from './route-outlet-scope.tsrx'
import { defaultRouterRuntime } from './default-router'
import type { RouteOutletProps } from '../props'

/** Renders the current route entry for the enclosing scope's stack. */
export function RouteOutlet(props: RouteOutletProps): any {
	const { host, flow } = useRouteOutletScope(props.stack, defaultRouterRuntime)
	return (
		<ClientRouteOutlet
			host={host}
			flow={flow}
			authority={props.authority}
			resumeUrl={props.resumeUrl}
			onResume={props.onResume}
		>
			{props.children}
		</ClientRouteOutlet>
	)
}

import { useLayoutEffect } from 'octane'
import type { RouteOutletProps } from './props'
import type { BrowserRouterHost } from './browser-router-host.web'
import { ClientRouteOutlet } from './ClientRouteOutlet.web.tsrx'
import { ClientRouteOutlet as RetainedRouteOutlet } from './client-route-outlet.shared.tsrx'
import { useRouteOutletScope } from './route-outlet-scope.tsrx'
import { defaultRouterRuntime, startDefaultBrowserRouter } from './default-router.web'

export function RouteOutlet(props: RouteOutletProps): any {
	const { host, flow, defaultClient } = useRouteOutletScope(props.stack, defaultRouterRuntime)
	useLayoutEffect(() => {
		if (defaultClient && flow === 'root') {
			return startDefaultBrowserRouter()
		}
	}, [defaultClient, flow, props.authority])

	if (host.getRenderHost) {
		return (
			<RetainedRouteOutlet host={host} flow={flow} authority={props.authority} resumeUrl={props.resumeUrl} onResume={props.onResume}>
				{props.children}
			</RetainedRouteOutlet>
		)
	}

	return (
		<ClientRouteOutlet host={host as BrowserRouterHost} flow={flow} authority={props.authority} resumeUrl={props.resumeUrl} onResume={props.onResume}>
			{props.children}
		</ClientRouteOutlet>
	)
}

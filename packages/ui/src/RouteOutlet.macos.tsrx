/** @jsxImportSource @octane-xplat/macos-renderer */
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { useRouteOutletScope } from './route-outlet-scope.tsrx'
import { defaultRouterRuntime } from './default-router.macos'
import type { RouteOutletProps } from './props'

export function RouteOutlet(props: RouteOutletProps): any {
	const { host, flow } = useRouteOutletScope(props.stack, defaultRouterRuntime)
	return <ClientRouteOutlet host={host} flow={flow}>{props.children}</ClientRouteOutlet>
}

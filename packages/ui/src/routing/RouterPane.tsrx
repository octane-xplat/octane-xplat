import { ClientRouteOutlet } from './client-route-outlet.shared.tsrx'
import { resolvePaneRouterHost } from './pane-router-client'
import type { RouterPaneProps } from '../props'

/** Mount a pane host's explicitly owned instance and stack. The creator owns
 * instance disposal; unmounting this pane removes only its rendering flow.
 * Browser URLs and native Frames remain outside this independent pane host.
 * @example
 * import { RouterPane, createPaneRouterHost, createRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing'
 * const host = createPaneRouterHost()
 * const navigation = createRouter({ host: host.host,
 *   catalog: defineRoutes([defineRoute({ path: '/help' }).screen(() => null)]) })
 * host.attach(navigation)
 * function Workspace() { return <RouterPane host={host} router={navigation} /> }
 */
export function RouterPane<Contracts, Stacks extends string, Transitions extends string>(
	props: RouterPaneProps<Contracts, Stacks, Transitions>,
): any {
	const host = resolvePaneRouterHost(props.host)
	const flow = props.stack ?? 'root'
	if (props.stack !== undefined) {
		props.router.forStack(props.stack)
	}

	if (host.scope(flow).instance !== props.router) {
		throw new Error('RouterPane host belongs to a different router instance')
	}

	return (
		<ClientRouteOutlet host={host} flow={flow}>
			{props.children}
		</ClientRouteOutlet>
	)
}

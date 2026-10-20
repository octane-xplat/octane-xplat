// Renderer-neutral owned outlets for explicit panes and native platform hosts.
import { RouterOutletBoundary } from './router-outlet-boundary.tsrx'
// Renderer-neutral provider/portal composition; useOwnedContent selects the host.
import { useContext, useLayoutEffect, useMemo } from 'octane'
import { RouterFlowVisibilityContext } from './router-hook-context'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import { useOwnedContent } from './use-owned-content'
import type { ClientRouteOutletProps } from './props'
import { RenderRouteOutlet } from './RenderRouteOutlet.tsrx'

function OwnedClientRouteOutlet(props: ClientRouteOutletProps): any {
	const flow = props.flow ?? 'root'
	const content = useOwnedContent()
	const owner = content.owner
	const host = props.host
	const active = useContext(RouterFlowVisibilityContext)
	useLayoutEffect(() => {
		host.setFlowActive?.(flow, active)
		return () => host.setFlowActive?.(flow, false)
	}, [host, flow, active])

	const scope = useMemo(() => ({ ...host.scope(flow), host }), [host, flow])
	useLayoutEffect(() => {
		const detach = host.mount(flow, owner)
		return () => {
			try {
				const cleanup = detach()
				if (cleanup) {
					void cleanup.catch(() => console.warn('[octane-xplat] Route outlet cleanup failed'))
				}
			} catch {
				console.warn('[octane-xplat] Route outlet cleanup failed')
			}
		}
	}, [host, flow, owner])

	const renderHost = host.getRenderHost?.(flow)
	return (
		<RouterRenderScopeProvider scope={scope}>
			{renderHost ? (
				<RenderRouteOutlet host={renderHost} flow={flow} modal={host.isModalFlow?.(flow)}>
					{props.children}
				</RenderRouteOutlet>
			) : (
				props.children
			)}
			{content.element}
		</RouterRenderScopeProvider>
	)
}

export function ClientRouteOutlet(props: ClientRouteOutletProps): any {
	return (
		<RouterOutletBoundary host={props.host} flow={props.flow ?? 'root'} base={props.children}>
			<OwnedClientRouteOutlet {...props} />
		</RouterOutletBoundary>
	)
}

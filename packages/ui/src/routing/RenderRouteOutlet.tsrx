// Renderer-neutral composition; View resolves to the platform container.
import { useLayoutEffect, useMemo, useSyncExternalStore } from 'octane'
import { RoutePane } from './RoutePane'
import { ClientRouteView } from './ClientRouteView.tsrx'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import type { RenderRouteOutletProps } from '../props'

/** Internal retained-pane outlet, shared by native tabs and desktop panes. */
export function RenderRouteOutlet(props: RenderRouteOutletProps): any {
	const flow = props.flow ?? 'root'
	const host = props.host
	// Child refs attach before the outlet's layout effect. Admission installs
	// only this owner's map; duplicate outlets cannot replace another's refs.
	const targets = useMemo(() => new Map<string, unknown>(), [host, flow])
	const setView = (id: string, view: unknown) => {
		if (view) {
			targets.set(id, view)
		} else {
			targets.delete(id)
		}
	}

	const scope = useMemo(() => host.scope(flow), [host, flow])
	useLayoutEffect(
		() => host.mount(flow, { modal: props.modal, views: targets }),
		[host, flow, props.modal, targets],
	)

	const views = useSyncExternalStore(
		host.views.subscribe,
		host.views.getSnapshot,
		host.views.getSnapshot,
	)

	const view = views.get(flow)
	const top = view?.entries.at(-1) ?? null
	const entries = view?.entries.filter((entry) => entry !== null) ?? []
	if (view?.staged) {
		entries.push(view.staged)
	}

	useLayoutEffect(() => {
		view?.rendered()
	}, [view])

	return (
		<RouterRenderScopeProvider scope={scope}>
			<RoutePane active={!top} viewRef={(view) => setView('base', view)}>
				{props.children}
			</RoutePane>
			@for (const entry of entries; key entry.id) {
				<RoutePane active={entry === top} viewRef={(view) => setView(entry.id, view)}>
					<ClientRouteView entry={entry} />
				</RoutePane>
			}
		</RouterRenderScopeProvider>
	)
}

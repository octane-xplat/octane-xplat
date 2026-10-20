// Renderer-neutral composition; platform hosts own actual view containers.
import { useLayoutEffect } from 'octane'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import { RouteBoundary } from './RouteBoundary'
import type { ClientRouteEntry } from './client-route-entry'

function ClientRenderBoundary(props: { entry: ClientRouteEntry; children?: any }): any @{
	@try {
		<>{props.children}</>
	} @catch (error) {
		props.entry.failed(error)
		<></>
	}
}

export function ClientRouteView(props: { entry: ClientRouteEntry }): any {
	const entry = props.entry
	const Screen = entry.content.screen
	let content = <Screen {...entry.content.props} />
	for (let index = entry.content.layouts.length - 1; index >= 0; index--) {
		const Layout = entry.content.layouts[index]
		const child = content
		content = <Layout>{child}</Layout>
	}
	useLayoutEffect(() => { entry.rendered() }, [entry])
	const route = entry.route
	return <ClientRenderBoundary key={entry.id} entry={entry}><RouterRenderScopeProvider scope={entry.scope}>
		<RouteBoundary boundary={entry.content.boundary} route={route}>{content}</RouteBoundary>
	</RouterRenderScopeProvider></ClientRenderBoundary>
}

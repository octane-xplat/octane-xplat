/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import { ClientRouteOutlet, type BrowserOutletHost } from './ClientRouteOutlet.web.tsrx'
import type { RouterInstance } from '../props'

function DefaultWebApp(props: { host: BrowserOutletHost }): any {
	return <ClientRouteOutlet host={props.host} />
}

/** Document-level route host for web — scopes the router and renders the
 *  app shell. */
export function WebRouterRoot(props: {
	/** Browser outlet host owning history and views. */
	host: BrowserOutletHost
	/** Router instance driving navigation. */
	router: RouterInstance<any>
	/** App shell override — defaults to the standard outlet layout. */
	App?: (props: { router: RouterInstance<any> }) => any
}): any {
	const scope = useMemo(() => ({ ...props.host.scope('root'), host: props.host }), [props.host])
	const App = props.App ?? DefaultWebApp
	return (
		<RouterRenderScopeProvider scope={scope}>
			<App router={props.router} host={props.host} />
		</RouterRenderScopeProvider>
	)
}

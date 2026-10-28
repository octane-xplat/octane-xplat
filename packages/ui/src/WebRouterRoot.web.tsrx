/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import { ClientRouteOutlet, type BrowserOutletHost } from './ClientRouteOutlet.web.tsrx'
import type { RouterInstance } from './props'

function DefaultWebApp(props: { host: BrowserOutletHost }): any {
	return <ClientRouteOutlet host={props.host} />
}

export function WebRouterRoot(props: {
	host: BrowserOutletHost
	router: RouterInstance<any>
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

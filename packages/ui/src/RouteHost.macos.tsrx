/** @jsxImportSource @octane-xplat/macos-renderer */

import type { Route } from './props'
import { RouteBoundary } from './RouteBoundary.macos.tsrx'

type RouteHostProps = {
	screen: any
	layouts: any[]
	params: Record<string, unknown>
	/** The route's declared ErrorBoundary export, if any. */
	boundary?: any
	/** The committed route being rendered — passed to the boundary. */
	route?: Route
}

export function RouteHost(props: RouteHostProps) @{
	const Screen = props.screen
	let child = <Screen {...props.params} />
	for (let i = props.layouts.length - 1; i >= 0; i--) {
		const Layout = props.layouts[i]
		const nested = child
		child = <Layout>{nested}</Layout>
	}

	<RouteBoundary boundary={props.boundary} route={props.route}>
		<>{child}</>
	</RouteBoundary>
}

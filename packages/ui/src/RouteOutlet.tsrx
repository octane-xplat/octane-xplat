/** @jsxImportSource @nativescript-community/octane */
import { useLayoutEffect } from 'octane'
import { useOwnedContent } from './use-owned-content'
import { registerRouteContentOwner } from './route-content-owner'
import type { RouteOutletProps } from './props'

/** Native route Pages and modals inherit providers around this mounted outlet. */
export function RouteOutlet(props: RouteOutletProps) {
	const content = useOwnedContent()
	useLayoutEffect(() => registerRouteContentOwner(props.stack ?? 'root', content.owner), [props.stack, content.owner])
	return <>{props.children}{content.element}</>
}

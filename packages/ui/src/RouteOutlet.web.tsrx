import type { RouteOutletProps } from './props'

/** Routes on this renderer already share the declaring component tree. */
export function RouteOutlet(props: RouteOutletProps) {
	return <>{props.children}</>
}

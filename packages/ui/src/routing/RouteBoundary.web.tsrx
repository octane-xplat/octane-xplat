/** @jsxImportSource @octane-xplat/jsx/dom */
import type { RouteBoundaryProps } from '../props'
import type { JSX } from 'octane/jsx-runtime'

/** Route-level error-boundary host — web twin of RouteBoundary. */
export function RouteBoundary(props: RouteBoundaryProps): JSX.Element @{
	const Boundary = props.boundary
	if (!Boundary) {
		return <>{props.children}</>
	}

	@try {
		<>{props.children}</>
	} @catch (error, reset) {
		<Boundary error={error} reset={reset} route={props.route} />
	}
}

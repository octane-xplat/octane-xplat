/** @jsxImportSource @octane-xplat/macos-renderer */

type RouteBoundaryProps = {
	boundary?: any
	route?: any
	children?: any
}

/** Route-level error-boundary host — AppKit twin of RouteBoundary. */
export function RouteBoundary(props: RouteBoundaryProps) @{
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

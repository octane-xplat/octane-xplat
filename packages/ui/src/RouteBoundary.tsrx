/** @jsxImportSource @nativescript-community/octane */

type RouteBoundaryProps = {
	boundary?: any;
	route?: any;
	children?: any;
};

/** Route-level error-boundary host — wraps a route's rendered subtree in a
 *  portable @try/@catch so a declared `ErrorBoundary` export renders in
 *  place of a throwing screen (or its layout chain). The boundary
 *  component receives `{ error, reset, route }`; `reset` clears the
 *  caught error and remounts the subtree. Without a declared boundary
 *  the children render bare and errors propagate as they always have. */
export function RouteBoundary(props: RouteBoundaryProps) @{
	const Boundary = props.boundary;
	if (!Boundary) {
		return <>{props.children}</>;
	}

	@try {
		<>{props.children}</>
	} @catch (error, reset) {
		<Boundary error={error} reset={reset} route={props.route} />
	}
}

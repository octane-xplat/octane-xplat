/** Keep the transport's raw @stack segment separate from encoded route segments.
 * A root path beginning with @ is encoded as %40 by buildRouteLocation. */
export function routeStackBase(base = '/', stack = 'root'): string {
	return stack === 'root' ? base : base.replace(/\/+$/, '') + '/@' + encodeURIComponent(stack)
}

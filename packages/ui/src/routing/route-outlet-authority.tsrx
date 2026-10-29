import { useContext, useEffect, useLayoutEffect, useMemo } from 'octane'
import { RouterScopeContext } from './router-hook-context'
import { useNavigation, useRouter } from './router-hooks.tsrx'
import type { RouteOutletProps, RouterInstance } from '../props'

/** Keep numeric and string authority values distinct in renderer keys. */
export function routeAuthorityKey(authority: RouteOutletProps['authority']): string {
	return typeof authority + ':' + String(authority)
}

/** The new owner consumes its handoff only after startup preparation settles. */
export function RouteOutletResume(props: Pick<RouteOutletProps, 'resumeUrl' | 'onResume'>): any {
	const scope = useContext(RouterScopeContext)
	const instance = scope?.instance as RouterInstance<any>
	const navigation = useRouter(instance)
	const state = useNavigation(instance)
	const lifetime = useMemo(() => ({ active: true, started: false }), [])
	useLayoutEffect(
		() => () => {
			lifetime.active = false
		},
		[],
	)

	useEffect(() => {
		if (
			!lifetime.active ||
			props.resumeUrl === undefined ||
			lifetime.started ||
			state.status === 'pending'
		) {
			return
		}

		lifetime.started = true
		void navigation.navigateUrl(props.resumeUrl, { replace: true }).then((result) => {
			if (lifetime.active) {
				props.onResume?.(result)
			}
		})
	}, [navigation, props.resumeUrl, state.status])

	return null
}

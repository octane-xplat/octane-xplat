/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { useOwnedContent } from './use-owned-content'
import { popRoute, pushRouteWithOwner } from './route'
import type { NativeRouteNavigatorReturn } from './props'

/** Native Frame navigation bound to the providers surrounding element. */
export function useNativeRouteNavigator(stack = 'root'): NativeRouteNavigatorReturn {
	const content = useOwnedContent()
	const actions = useMemo(() => ({
		push: (route: Parameters<NativeRouteNavigatorReturn['push']>[0]) => pushRouteWithOwner(content.owner, { ...route, stack }),
		pop: () => popRoute(stack),
	}), [content.owner, stack])

	return { ...actions, element: content.element }
}

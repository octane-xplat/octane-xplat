import { useContext, useSyncExternalStore } from 'octane'
import { RouterScopeContext } from '../../routing/router-hook-context'
import { requireRouterRenderScope } from '../../routing/router-render-scope'
import { navLinkActivation, navLinkDestination, navLinkIsActive } from './nav-link'
import type { NavLinkInput, NavigationItemInput, NavLinkContracts } from './nav-link'
import type { NavigationActivationEvent, RouterState, RouterNavigator } from '../../props'

const emptyState: RouterState<NavLinkContracts> = Object.freeze({
	route: null,
	navigation: Object.freeze({ status: 'idle' }),
	canGoBack: false,
	modal: false,
})

const readEmpty = () => emptyState
const subscribeEmpty = () => () => {}

/** Shared route ownership and activation for links and navigation chrome.
 * URL/action items need no router provider. Typed route items always do. */
export function useNavigationItem(
	props: NavigationItemInput,
	mode: 'item' | 'link' | 'route' = 'item',
) {
	const scope = useContext(RouterScopeContext)
	if (mode === 'route' && props.to === undefined) {
		throw new TypeError('A navigation link requires a canonical to destination')
	}

	if (mode === 'link' && props.to === undefined && props.href === undefined) {
		throw new TypeError('A menu link requires a destination or href')
	}

	if (props.to !== undefined && props.href !== undefined) {
		throw new TypeError('Choose a typed route destination or href, not both')
	}

	// Literal destinations use the declared catalog. Opaque values carry their
	// own instance proof and can safely inherit the provider without a type map.
	const navigator =
		props.to === undefined
			? null
			: (requireRouterRenderScope(scope, props.router, typeof props.to === 'string')
					.navigator as RouterNavigator<NavLinkContracts, string, string>)

	const state = useSyncExternalStore(
		navigator?.subscribe ?? subscribeEmpty,
		navigator?.getSnapshot ?? readEmpty,
		navigator?.getSnapshot ?? readEmpty,
	)

	const destination = navigator ? navLinkDestination(props as NavLinkInput) : undefined
	const href = navigator ? navigator.href(destination!) : props.href
	const selected =
		props.isSelected ?? !!(navigator && href && navLinkIsActive(state.route?.href, href, props))

	const disabled = props.disabled ?? props.isDisabled ?? false
	const preservesBrowserNavigation = (event: NavigationActivationEvent) =>
		href != null &&
		((event.button !== undefined && event.button !== 0) ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			(props.target && props.target !== '_self') ||
			props.download !== undefined)

	const activate = (
		event: NavigationActivationEvent,
		web: boolean,
		followHref?: (href: string) => void,
	) => {
		if (disabled) {
			event.preventDefault()
			return false
		}

		;(props.onPress ?? props.onClick)?.(event)
		if (event.defaultPrevented) {
			return false
		}

		if (web && preservesBrowserNavigation(event)) {
			return false
		}

		if (navigator) {
			event.preventDefault()
			void navigator.navigate(destination!)
		} else if (!web && href) {
			followHref?.(href)
		}

		return true
	}

	return {
		href,
		selected,
		disabled,
		preservesBrowserNavigation,
		activateWeb: (event: NavigationActivationEvent) => activate(event, true),
		activateNative: (followHref?: (href: string) => void) =>
			activate(navLinkActivation(), false, followHref),
	}
}

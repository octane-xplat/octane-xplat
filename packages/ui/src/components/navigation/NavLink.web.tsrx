/** @jsxImportSource @octane-xplat/jsx/dom */
import type {
	NavLinkProps,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from '../../props'

import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import type { NavLinkInput } from './nav-link'

export function NavLink<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: NavLinkProps<Contracts, Stacks, Transitions>): any

export function NavLink(props: NavLinkInput) @{
	const link = useNavigationItem(props, 'route')

	<a
		id={props.id}
		href={link.href}
		target={props.target}
		rel={props.rel}
		download={props.download}
		className={[props.className, link.selected ? props.activeClassName : '']}
		style={props.style}
		aria-current={link.selected ? 'page' : undefined}
		aria-disabled={link.disabled || undefined}
		tabIndex={link.disabled ? -1 : undefined}
		onClick={link.activateWeb}
	>
		{props.children}
	</a>
}

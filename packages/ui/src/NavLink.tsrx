/** @jsxImportSource @nativescript-community/octane */
import type {
	NavLinkProps,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from './props'

import { Pressable } from './Pressable'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import type { NavLinkInput } from './nav-link'
import { cx } from '@octane-xplat/lib'

export function NavLink<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: NavLinkProps<Contracts, Stacks, Transitions>): any

export function NavLink(props: NavLinkInput) @{
	const link = useNavigationItem(props, 'route')

	<Pressable
		id={props.id}
		className={cx(props.className, link.selected ? props.activeClassName : undefined)}
		style={props.style}
		accessibilityRole="link"
		accessibilityState={{ disabled: link.disabled, selected: link.selected }}
		disabled={link.disabled}
		onPress={() => link.activateNative()}
	>
		{props.children}
	</Pressable>
}

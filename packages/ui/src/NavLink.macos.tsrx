/** @jsxImportSource @xplat/macos/renderer */
import type { NavLinkProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { pushRoute } from './route.macos'

export function NavLink(props: NavLinkProps) @{
	<Pressable
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityRole="link"
		onPress={() => pushRoute(props.route)}
	>
		{props.children}
	</Pressable>
}

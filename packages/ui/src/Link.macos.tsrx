/** @jsxImportSource @octane-xplat/macos-renderer */
import type { LinkProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { pushDeepLink } from './route.macos'

export function Link(props: LinkProps) @{
	<Pressable
		className={props.className}
		style={props.style}
		accessibilityRole="link"
		onPress={() => pushDeepLink(props.href)}
	>
		{props.children}
	</Pressable>
}

/** @jsxImportSource @octane-xplat/macos-renderer */
import type { LinkProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { pushDeepLink } from './route.macos'

export function Link(props: LinkProps) @{
	<Pressable
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityRole={props.accessibilityRole ?? 'link'}
		onPress={() => { props.onPress?.(); pushDeepLink(props.href) }}
	>
		{props.children}
	</Pressable>
}

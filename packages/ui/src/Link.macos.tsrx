/** @jsxImportSource @octane-xplat/macos-renderer */
import type { LinkProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { followHref } from './nav-href'

export function Link(props: LinkProps) @{
	<Pressable
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityRole={props.accessibilityRole ?? 'link'}
		onPress={() => {
			props.onPress?.()
			followHref(props.href)
		}}
	>
		{props.children}
	</Pressable>
}

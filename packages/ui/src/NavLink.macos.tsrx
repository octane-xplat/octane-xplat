/** @jsxImportSource @octane-xplat/macos-renderer */
import type { NavLinkProps } from './props';
import { Pressable } from './Pressable.macos.tsrx';
import { pushRoute, useRoute } from './route.macos';
import { cx } from './cx';

export function NavLink(props: NavLinkProps) @{
	const current = useRoute(props.route.stack);
	const active = !!current
		&& current.name === props.route.name
		&& Object.keys(current.params).length === Object.keys(props.route.params).length
		&& Object.entries(props.route.params).every(
			([key, value]) => String(current.params[key]) === String(value),
		);

	<Pressable
		className={cx(props.className, active ? props.activeClassName : undefined)}
		style={props.style}
		accessibilityRole="link"
		onPress={() => pushRoute(props.route)}
	>
		<flexboxlayout flexDirection="row">{props.children}</flexboxlayout>
	</Pressable>
}

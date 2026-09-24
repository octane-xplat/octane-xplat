/** @jsxImportSource @nativescript-community/octane */
import type { NavLinkProps } from './props';
import { Pressable } from './Pressable.native.tsrx';
import { pushRoute, useRoute } from './route.native';
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
		onPress={() => pushRoute(props.route)}
	>
		<flexboxlayout flexDirection="row">{props.children}</flexboxlayout>
	</Pressable>
}

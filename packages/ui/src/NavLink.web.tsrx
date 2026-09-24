import type { NavLinkProps } from './props';
import { hrefFor, pushRoute, useRoute } from './route.web';

export function NavLink(props: NavLinkProps) @{
	const current = useRoute(props.route.stack);
	const active = !!current
		&& current.name === props.route.name
		&& Object.keys(current.params).length === Object.keys(props.route.params).length
		&& Object.entries(props.route.params).every(
			([key, value]) => String(current.params[key]) === String(value),
		);
	const href = hrefFor(props.route);
	const navigate = (event: any) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		pushRoute(props.route);
	};

	<a href={href} className={[props.className, active ? props.activeClassName : '']} onClick={navigate}>
		{props.children}
	</a>
}

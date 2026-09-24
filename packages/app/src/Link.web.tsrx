import { hrefFor, pushRoute } from '@octane-xplat/ui';
import type { RouteName } from './routes';

/** Link — web side: a real anchor (keyboard-navigable, href-shareable)
 *  whose click pushes the route in place instead of reloading. */
export function Link(props: {
	to: RouteName;
	params?: Record<string, unknown>;
	into?: string;
	className?: any;
	children?: any;
}) @{
	const route = {
		stack: props.into ?? 'root',
		name: props.to,
		params: props.params ?? {},
	};
	<a
		href={hrefFor(route)}
		className={props.className}
		onClick={(e: any) => {
			e.preventDefault();
			pushRoute(route);
		}}
	>
		{props.children}
	</a>
}

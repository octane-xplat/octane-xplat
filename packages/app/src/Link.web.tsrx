import { hrefFor, pushRoute } from '@octane-xplat/ui';
import type { RouteLinkProps } from './routes';

/** Link — web side: a real anchor (keyboard-navigable, href-shareable)
 *  whose click pushes the route in place instead of reloading. */
export function Link(props: RouteLinkProps) @{
	const route = {
		stack: props.into ?? 'root',
		name: props.to,
		params: props.params ?? {},
		presentation: props.presentation,
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

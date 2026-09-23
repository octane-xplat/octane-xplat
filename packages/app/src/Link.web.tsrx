import type { RouteName } from './screens';

/** Link — web side: a real anchor (keyboard-navigable, href-shareable). */
export function Link(props: {
	to: RouteName;
	params?: Record<string, unknown>;
	className?: any;
	children?: any;
}) @{
	const q = new URLSearchParams(props.params as Record<string, string> ?? {}).toString();
	<a href={'#/' + props.to + (q ? '?' + q : '')} className={props.className}>
		{props.children}
	</a>
}

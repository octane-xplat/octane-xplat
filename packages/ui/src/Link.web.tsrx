import type { LinkProps } from './props';

export function Link(props: LinkProps) @{
	<a
		id={props.id}
		href={props.href}
		target={props.target ?? '_blank'}
		rel="noreferrer"
		role={props.accessibilityRole ?? 'link'}
		onClick={props.onPress}
		className={props.className}
		style={props.style}
	>
		{props.children}
	</a>
}

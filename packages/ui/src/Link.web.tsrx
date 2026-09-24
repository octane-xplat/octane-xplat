import type { LinkProps } from './props';

export function Link(props: LinkProps) @{
	<a
		href={props.href}
		target={props.target ?? '_blank'}
		rel="noreferrer"
		className={props.className}
	>
		{props.children}
	</a>
}

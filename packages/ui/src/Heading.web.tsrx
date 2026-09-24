import type { HeadingProps } from './props';
import { applyWebProps } from './platformProps.web';

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2;
	const tag = `h${level}`;
	<{tag}
		id={props.id}
		className={['vx-heading', `vx-h${level}`, props.className]}
		style={props.style}
		ref={(el: any) => applyWebProps(el, props.web)}
	>{props.children}</{tag}>
}

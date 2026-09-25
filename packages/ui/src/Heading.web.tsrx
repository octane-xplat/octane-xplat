import type { HeadingProps } from './props';
import { normStyle } from './layout-child.web';
import { applyWebProps } from './platformProps.web';

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2;
	const tag = `h${level}`;

	<{tag}
		id={props.id}
		className={['vx-heading', `vx-h${level}`, props.className]}
		style={normStyle(props.style)}
		ref={(el: any) => applyWebProps(el, props.web)}
	>{props.children}</{tag}>
}

/** @jsxImportSource @xplat/macos/renderer */
import type { NavIconProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon.macos.tsrx';

/** Circular icon container for navigation headers. Display-only. */
export function NavIcon(props: NavIconProps) @{
	<flexboxlayout
		id={props.id}
		className={cx('vx-navicon', props.className)}
		style={props.style}
		justifyContent="center"
		alignItems="center"
	>
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</flexboxlayout>
}

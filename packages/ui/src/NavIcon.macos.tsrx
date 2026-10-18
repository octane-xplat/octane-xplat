/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { NavIconProps } from './props';
import { cx } from '@octane-xplat/lib';
import { Icon } from './Icon.macos.tsrx';

/** Circular icon container for navigation headers. Display-only. */
export function NavIcon(props: NavIconProps) @{
	<masonview id={props.id} className={cx('vx-navicon', props.className)} style={mergeStyle({display: "flex"}, props.style)} justifyContent="center" alignItems="center">
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</masonview>
}

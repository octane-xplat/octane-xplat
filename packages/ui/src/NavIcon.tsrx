/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { NavIconProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon';

/** Circular icon container for navigation headers (TopNavHeading,
 *  SideNavHeading). Display-only — the `icon` prop takes an element or a
 *  registered icon name. */
export function NavIcon(props: NavIconProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-navicon', props.className)} style={mergeStyle({justifyContent: "center", alignItems: "center"}, mergeStyle({display: "flex"}, props.style as any))}>
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</masonview>
}

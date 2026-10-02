/** @jsxImportSource @nativescript-community/octane */
import type { NavIconProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon';

/** Circular icon container for navigation headers (TopNavHeading,
 *  SideNavHeading). Display-only — the `icon` prop takes an element or a
 *  registered icon name. */
export function NavIcon(props: NavIconProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-navicon', props.className)}
		style={props.style}
		justifyContent="center"
		alignItems="center"
	>
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</flexboxlayout>
}

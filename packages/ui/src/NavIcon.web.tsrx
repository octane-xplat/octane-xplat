import type { NavIconProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';

/** Circular icon container for navigation headers (TopNavHeading,
 *  SideNavHeading). Display-only — the `icon` prop takes an element or a
 *  registered icon name. */
export function NavIcon(props: NavIconProps) @{
	<span
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-navicon', props.className]}
		style={props.style}
		aria-hidden="true"
	>
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</span>
}

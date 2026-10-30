/** @jsxImportSource @octane-xplat/jsx/dom */
import type { NavIconProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Circular icon container for navigation headers (TopNavHeading,
 *  SideNavHeading). Display-only — the `icon` prop takes an element or a
 *  registered icon name. */
export function NavIcon(props: NavIconProps): JSX.Element @{
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

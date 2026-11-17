/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { NavIconProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Icon } from '../media/Icon.tsrx'
import { layoutChildProps } from '../layout/layout-child'

/** Circular icon container for navigation headers (TopNavHeading,
 *  SideNavHeading). Display-only — the `icon` prop takes an element or a
 *  registered icon name. */
export function NavIcon(props: NavIconProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-navicon', props.className]}
    {...layoutChildProps(props, mergeStyle({ display: 'flex' }, props.style))}
  >
    {typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
  </masonview>
}

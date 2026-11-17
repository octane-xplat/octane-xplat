/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { UserProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Avatar } from '../media/Avatar.macos.tsrx'

/** User — avatar + name/description row. `onSelect` makes the row
 *  tappable. */
export function User(props: UserProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-user', props.onSelect && 'vx-user--pressable', props.className]}
    style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, props.style))}
    onTap={props.onSelect}
  >
    <Avatar src={props.src} fallback={props.fallback} alt={props.name} size={props.size} />
    <masonview className="vx-user-body" style={{ display: 'flex' }}>
      @if (props.name != null) {
        <label className="vx-user-name" text={props.name} />
      }
      @if (props.description != null) {
        <label className="vx-user-desc" text={props.description} />
      }
    </masonview>
  </masonview>
}

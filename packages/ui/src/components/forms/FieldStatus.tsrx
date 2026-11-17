/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { FieldStatusComponentProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** `FieldStatus` — standalone status message (Astryx part): severity text
 *  with a tone class. */
export function FieldStatus(props: FieldStatusComponentProps): unknown @{
  const variant = props.variant ?? 'detached'

  <masonview
    ref={(e: any) => void (prepareUIHost(e), applyEscapeProps(e, props), applyUIHostModifiers(e, props))}
    id={props.id}
    className={[
      'vx-fieldstatus',
      `vx-fieldstatus--${props.type}`,
      `vx-fieldstatus--${variant}`,
      props.className,
    ]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    @if (props.message != null) {
      <label className="vx-fieldstatus-text" text={props.message} />
    }
  </masonview>
}

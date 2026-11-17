/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SeparatorProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Separator — hairline rule. `orientation` picks which axis it spans;
 *  thickness/color come from the app's `vx-separator` styling. */
export function Separator(props: SeparatorProps): unknown @{
  const vertical = props.orientation === 'vertical'

  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={[
      'vx-separator',
      vertical ? 'vx-separator--v' : 'vx-separator--h',
      props.className,
    ]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  />
}

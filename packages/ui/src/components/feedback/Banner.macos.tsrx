/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { BannerProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Icon } from '../media/Icon.macos.tsrx'

/** Banner — inline notice strip with optional dismiss affordance. */
export function Banner(props: BannerProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-banner', props.className]}
    style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, props.style))}
  >
    @if (props.icon) {
      <Icon
        name={typeof props.icon === 'string' ? props.icon : 'xplat-info'}
        className="vx-banner-icon"
      />
    }
    <masonview className="vx-banner-body">
      {props.children}
    </masonview>
    @if (props.onDismiss) {
      <label
        className="vx-banner-dismiss"
        text="✕"
        style={{ marginLeft: 8, width: 12, height: 16, textAlign: 'center' }}
        onTap={props.onDismiss}
      />
    }
  </masonview>
}

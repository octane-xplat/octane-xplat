/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ProgressGroupProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Meter } from './Meter.tsrx'

/** ProgressGroup — stacked labeled Meter rows. */
export function ProgressGroup(props: ProgressGroupProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-progressgroup', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    @for (const item of props.items; key item.key) {
      <masonview className="vx-progressgroup-row" style={{ display: 'flex' }}>
        <Meter value={item.value} max={item.max} accessibilityLabel={item.label} />
        @if (item.label != null) {
          <label className="vx-progressgroup-label" text={item.label} />
        }
      </masonview>
    }
  </masonview>
}

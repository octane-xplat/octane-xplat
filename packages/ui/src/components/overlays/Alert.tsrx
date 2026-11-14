/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { AlertProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Icon } from '../media/Icon.tsrx'

/** Alert — status callout. `tone` picks a class modifier. */
export function Alert(props: AlertProps): unknown @{
  const tone = props.tone ?? 'info'

  <masonview
    ref={(v: any) => applyEscapeProps(v, props)}
    id={props.id}
    className={cx('vx-alert', 'vx-alert--' + tone, props.className)}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    @if (props.icon) {
      <Icon name={props.icon} className="vx-alert-icon" />
    }
    <masonview className="vx-alert-body">
      @if (props.title != null) {
        <label className="vx-alert-title" text={props.title} />
      }
      {props.children}
    </masonview>
  </masonview>
}

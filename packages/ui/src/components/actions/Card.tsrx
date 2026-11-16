/** @jsxImportSource @octane-xplat/jsx */
import { styleRecord } from '../../internal/layout/style-merge'
import type { CardProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps): unknown @{
  <masonview
    ref={(v: any) => applyEscapeProps(v, props)}
    id={props.id}
    className={[
      'vx-card',
      props.variant && `vx-card--${props.variant}`,
      props.elevation && `vx-card--elev-${props.elevation}`,
      props.className,
    ]}
    style={{
      ...styleRecord(props.style),
      ...(props.padding == null
        ? {}
        : {
            paddingTop: props.padding * 4,
            paddingRight: props.padding * 4,
            paddingBottom: props.padding * 4,
            paddingLeft: props.padding * 4,
          }),
      width: props.width,
      height: props.height,
      maxWidth: props.maxWidth,
    }}
  >
    @if (props.header != null) {
      <masonview className="vx-card-header">
        {props.header}
      </masonview>
    }
    <masonview className="vx-card-body">
      {props.children}
    </masonview>
    @if (props.footer != null) {
      <masonview className="vx-card-footer">
        {props.footer}
      </masonview>
    }
  </masonview>
}

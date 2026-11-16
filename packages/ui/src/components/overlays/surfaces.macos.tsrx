/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { OverlayProps } from '../../props'
export function Overlay(props: OverlayProps): unknown @{
  @if (props.open) {
    <masonview
      className={['vx-overlay', props.className]}
      style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
      accessibilityLabel={props.accessibilityLabel}
    >
      {props.children}
    </masonview>
  }
}

/** @jsxImportSource @octane-xplat/jsx */
import type { SafeAreaProps } from '../../props'
export function SafeArea(props: SafeAreaProps): unknown @{
  <masonview id={props.id} className={['vx-safe-area', props.className]} style={props.style}>
    {props.children}
  </masonview>
}

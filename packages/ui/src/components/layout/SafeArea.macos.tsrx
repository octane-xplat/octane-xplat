/** @jsxImportSource @octane-xplat/jsx */
import type { SafeAreaProps } from '../../props'
import { cx } from '@octane-xplat/lib'

export function SafeArea(props: SafeAreaProps): unknown @{
  <masonview id={props.id} className={cx('vx-safe-area', props.className)} style={props.style}>
    {props.children}
  </masonview>
}

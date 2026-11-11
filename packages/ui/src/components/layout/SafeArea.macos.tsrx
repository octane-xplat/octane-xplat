/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SafeAreaProps } from '../../props'
import { cx } from '@octane-xplat/lib'

export function SafeArea(props: SafeAreaProps): unknown @{
  <masonview
    className={cx('vx-safe-area', props.className)}
    style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
  >
    {props.children}
  </masonview>
}

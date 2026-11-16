/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ScreenProps } from '../../props'
export function Screen(props: ScreenProps): unknown @{
  <masonview
    id={props.id}
    className={['vx-screen', props.className]}
    style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
  >
    {props.children}
  </masonview>
}

/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { KeyboardAvoidingProps } from '../../props'
export function KeyboardAvoiding(props: KeyboardAvoidingProps): unknown @{
  const forwardedRef = useMemo(() => refList(props.ref), [props.ref])

  <masonview
    id={props.id}
    ref={forwardedRef}
    className={['vx-keyboard-avoiding', props.className]}
    style={props.style}
  >
    {props.children}
  </masonview>
}

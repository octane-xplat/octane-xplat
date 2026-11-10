/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { PressableProps } from '../src/props'
import { refList } from '../src/internal/accessibility/ref-list'
import { layoutChildProps } from '../src/components/layout/layout-child'
import { mergeStyle } from '../src/internal/layout/style-merge'
import { virtualActivation } from '../src/gestures/virtual-activation'

// Action/layout fixture: callbacks do not qualify AppKit input delivery.
export function Pressable(props: PressableProps): unknown @{
  const host = useRef<object | null>(null)

  <masonview
    {...props}
    {...layoutChildProps(
      props,
      mergeStyle({ display: 'flex', flexDirection: 'column' }, props.style),
    )}
    accessibilityState={{
      ...props.accessibilityState,
      disabled: props.disabled || props.accessibilityState?.disabled,
    }}
    ref={refList(host, props.ref)}
    onTouch={
      props.disabled
        ? undefined
        : (event: { action: string }) => {
            if (event.action === 'down') {
              props.onPressIn?.()
            }

            if (event.action === 'up') {
              props.onPressOut?.()
            }
          }
    }
    onTap={
      props.disabled
        ? undefined
        : () => {
            if (host.current) {
              props.onPress?.(virtualActivation(host.current))
            }
          }
    }
  >
    {props.children}
  </masonview>
}

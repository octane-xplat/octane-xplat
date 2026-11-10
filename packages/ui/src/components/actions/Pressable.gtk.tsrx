/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo, useRef } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from '../layout/layout-child'
import { useInteractionHost } from '../../gestures/host.gtk.tsrx'
import { pressOptions } from '../../gestures/semantic-press'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'

/** masonview, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Column flex matches View's shape (and the web div);
 *  tap/longPress are gesture events, they attach to any view. */
export function Pressable(props: PressableProps): unknown @{
  const bindInput = useInteractionHost({ ...props, press: pressOptions(props) })
  const host = useRef<object | null>(null)
  const forwardedRef = useMemo(
    () =>
      refList(
        (v: object | null) => {
          host.current = v
          if (v) {
            applyEscapeProps(v, props)
          }
        },
        bindInput,
        props.ref,
      ),
    [bindInput, props.ref, props.ios, props.android, props.web],
  )

  <masonview
    ref={forwardedRef}
    id={props.id}
    testID={props.testID ?? ''}
    {...layoutChildProps(
      props,
      mergeStyle(
        { display: 'flex' },
        {
          ...styleRecord(props.style),
          ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}),
        },
      ),
    )}
    className={cx('vx-pressable', props.className)}
    isEnabled={!props.disabled}
    accessible={props.accessible ?? Boolean(props.onPress)}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(
      props.accessibilityRole ?? (props.onPress ? 'button' : undefined),
    )}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState({
      ...props.accessibilityState,
      disabled: props.disabled || props.accessibilityState?.disabled,
    })}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </masonview>
}

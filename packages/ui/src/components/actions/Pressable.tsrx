/** @jsxImportSource @octane-xplat/jsx */
import { styleRecord } from '../../internal/layout/style-merge'
import { useContext, useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import {
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../../internal/accessibility/native-accessibility'

import { layoutChildProps } from '../layout/layout-child'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { pressOptions } from '../../gestures/press-options'
import { InteractionScopeContext, interactionScopeOutlet } from '../../gestures/context.tsrx'

/** masonview, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Block flow preserves View's neutral content layout;
 *  tap/longPress are gesture events, they attach to any view. */
export function Pressable(props: PressableProps): unknown @{
  const scopes = useContext(InteractionScopeContext)
  const bindInput = useInteractionHost({
    ...props,
    gestures: props.disabled ? undefined : props.gestures,
    onPan: props.disabled ? undefined : props.onPan,
    onPinch: props.disabled ? undefined : props.onPinch,
    press: pressOptions(props),
  })

  const forwardedRef = useMemo(
    () =>
      refList(
        (v: any) => {
          if (v) {
            void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
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
    {...layoutChildProps(props, {
      ...styleRecord(props.style),
      ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}),
    })}
    className={['vx-pressable', props.className]}
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
    {interactionScopeOutlet(scopes, props.interactionScope, props.children)}
  </masonview>
}

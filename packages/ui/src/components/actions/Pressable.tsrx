/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useEffect, useEffectEvent, useMemo, useRef } from 'octane'
import { View as NativeView } from '@nativescript/core'
import { hostGlobal } from '../../internal/platform/host-bridge'
import { createPressableContact, pressableMotion, pressableContext } from './pressable-contact'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from '../layout/layout-child'
import { usePan } from '../layout/pan.tsrx'
import { usePinch } from '../layout/pinch.tsrx'

/** masonview, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Column flex matches View's shape (and the web div);
 *  tap/longPress are gesture events, they attach to any view. */
export function Pressable(props: PressableProps): unknown @{
  const contact = useMemo(createPressableContact, [])
  const panEnabled = Boolean(props.onPan)
  const pinchEnabled = Boolean(props.onPinch)

  useEffect(() => {
    // A disabled or replaced gesture owner cannot finish an old contact.
    return () => contact.cancel()
  }, [props.disabled, panEnabled, pinchEnabled])

  const activate = useEffectEvent((e?: unknown) => {
    if (!props.disabled && contact.allows(pressableMotion(e))) {
      props.onPress?.()
    }
  })

  const doubleActivate = useEffectEvent((e?: unknown) => {
    if (!props.disabled && contact.allows(pressableMotion(e))) {
      props.onDoublePress?.()
    }
  })

  const touch = useEffectEvent((e: unknown) => {
    const motion = pressableMotion(e)

    if (motion) {
      const configuration = hostGlobal('android')?.view?.ViewConfiguration
      const slop =
        motion.getActionMasked() === 0
          ? configuration?.get(pressableContext(e)).getScaledTouchSlop()
          : 0

      if (slop !== undefined) {
        contact.touch(motion, slop)
      }
    }

    if (props.disabled || typeof e !== 'object' || !e || !('action' in e)) {
      return
    }

    if (e.action === 'down') {
      props.onPressIn?.()
    } else if (e.action === 'up' || e.action === 'cancel') {
      props.onPressOut?.()
    }
  })

  const nativeHost = useRef<NativeView | null>(null)
  const hasPress = Boolean(props.onPress)
  const hasDoublePress = Boolean(props.onDoublePress)
  const forwardedRef = useMemo(
    () =>
      refList((v: NativeView | null) => {
        const previous = nativeHost.current

        if (previous) {
          NativeView.prototype.removeEventListener.call(previous, 'tap', activate)
          NativeView.prototype.removeEventListener.call(previous, 'doubleTap', doubleActivate)

          contact.cancel()
        }

        nativeHost.current = v
        if (v) {
          // Mason aliases the string 'tap' to a DOM-like native click event
          // without contact data. Call NativeScript's base listener API
          // so tap arbitration and accessibility retain NativeScript semantics.
          if (!props.disabled && hasPress) {
            NativeView.prototype.addEventListener.call(v, 'tap', activate)
          }

          if (!props.disabled && hasDoublePress) {
            NativeView.prototype.addEventListener.call(v, 'doubleTap', doubleActivate)
          }

          applyEscapeProps(v, props)
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web, props.disabled, hasPress, hasDoublePress],
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
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState({
      ...props.accessibilityState,
      disabled: props.disabled || props.accessibilityState?.disabled,
    })}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
    onPan={usePan(props.disabled ? undefined : props.onPan)}
    onSwipe={props.disabled ? undefined : props.onSwipe}
    onPinch={usePinch(props.disabled ? undefined : props.onPinch)}
    onLongPress={props.disabled ? undefined : props.onLongPress}
    onTouch={props.disabled ? undefined : touch}
  >
    {props.children}
  </masonview>
}

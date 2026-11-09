/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo, useRef } from 'octane'
import type { View } from '@nativescript/core'
import { useMeasure$ } from '../layout/useMeasure.tsrx'
import './pressable-control.windows'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import type { ActivationEvent } from '../../gestures/types'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from '../layout/layout-child'
import { useInteractionHost } from '../../gestures/host.windows.tsrx'
import { pressOptions } from '../../gestures/semantic-press'
import { dispatchWindowsActivation } from '../../gestures/input.windows'

/** Keep the shared drawing and layout, with a measured native control for
 * focus and native activation provenance. Pointer eligibility belongs to the
 * shared owner; native Click retains keyboard and virtual activation. */
export function Pressable(props: PressableProps): unknown @{
  const measured = useMeasure$()
  const disabled = Boolean(props.disabled || props.accessibilityState?.disabled)
  const bindInput = useInteractionHost({ ...props, press: pressOptions(props) })
  const host = useRef<View | null>(null)
  const forwardedRef = useMemo(
    () =>
      refList((v: View | null) => {
        host.current = v
        bindInput(v)
        measured.ref(v)
        if (v) {
          applyEscapeProps(v, props)
        }
      }, props.ref),
    [bindInput, measured.ref, props.ref, props.ios, props.android, props.web],
  )

  const peerProps = {
    style: {
      position: 'absolute' as const,
      // Auto offsets use the padded content's static position.
      left: 0,
      top: 0,
      width: measured.bounds$.get()?.width ?? 0,
      height: measured.bounds$.get()?.height ?? 0,
    },
    settings: {
      label: props.accessibilityLabel,
      accessible: props.accessible,
      onPress: props.onPress
        ? (source: ActivationEvent['source']) => {
            if (host.current) {
              dispatchWindowsActivation(host.current, source)
            }
          }
        : undefined,
    },
    isEnabled: !disabled,
    accessible: props.accessible,
    accessibilityRole: nativeAccessibilityRole(props.accessibilityRole),
    accessibilityHint: props.accessibilityHint,
    accessibilityValue: props.accessibilityValue,
    accessibilityState: nativeAccessibilityState({ ...props.accessibilityState, disabled }),
    accessibilityLiveRegion: props.accessibilityLiveRegion,
  }

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
  >
    {props.children}
    // Native hosts must be literal tags; a string-valued component variable
    // compiles as a universal function component and cannot mount.
    @if (props.accessibilityRole === 'link') {
      <xplatwindowslink {...peerProps} />
    } @else {
      <xplatwindowsbutton {...peerProps} />
    }
  </masonview>
}

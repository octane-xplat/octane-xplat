/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { VisuallyHiddenProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityState, nativeAccessibilityRole } from '../../internal/accessibility/native-accessibility'

/** VisuallyHidden — a 1dip, fully transparent container that keeps its
 *  subtree in the native accessibility tree (opacity:0 views stay exposed
 *  to TalkBack/VoiceOver, unlike visibility=hidden which drops them on
 *  iOS). For screen-reader labels and live-region announcements. */
export function VisuallyHidden(props: VisuallyHiddenProps): unknown @{
  const forwardedRef = useMemo(
    () =>
      refList((v: any) => {
        if (v) {
          void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web],
  )

  <masonview
    id={props.id}
    ref={forwardedRef}
    className="vx-visually-hidden"
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState)}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
    style={{ display: 'flex' }}
  >
    {props.children}
  </masonview>
}

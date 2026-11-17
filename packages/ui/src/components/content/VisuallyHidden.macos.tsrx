/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { VisuallyHiddenProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** VisuallyHidden — 1pt opacity-0 container; keeps content in the a11y
 *  tree while rendering invisible (AppKit hidden views drop from
 *  VoiceOver; transparent ones stay). */
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
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={props.accessibilityRole}
    accessibilityHint={props.accessibilityHint}
    style={{ display: 'flex' }}
  >
    {props.children}
  </masonview>
}

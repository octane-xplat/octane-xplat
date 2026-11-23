import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import type { NativeModifier } from '../../props'

/** The native escape-hatch bag has no counterpart in the DOM renderer —
 *  platform-suffix parity stub for shared leaves that still name it. */
export function applyNativeProps(
  _el: any,
  _props: {
    ios?: Record<string, any>
    android?: Record<string, any>
    modifiers?: readonly NativeModifier[]
  },
): void {}

/** Apply a web escape-hatch bag after the primitive's standard props. */
export function applyWebProps(el: any, props: Record<string, any> | undefined): void {
  applyEscapeProps(el, { web: props })
}

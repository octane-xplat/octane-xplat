import { isAndroid, isIOS } from '@nativescript/core'
import type { EscapeProps } from './escape-props-types.js'

/** Apply the active device's escape bag after the component's own props. */
export function applyEscapeProps(view: object | null | undefined, props: EscapeProps): void {
  const bag = isIOS ? props.ios : isAndroid ? props.android : undefined
  if (view && bag) {
    Object.assign(view, bag)
  }
}

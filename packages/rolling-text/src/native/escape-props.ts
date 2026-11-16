import { applyNativeEscapeProps } from '@octane-xplat/lib/escape-props'
import { isAndroid, isIOS } from '@nativescript/core'

/** Apply only the active device's escape bag after the primitive's own props. */
export function applyEscapeProps(view: any, props: { ios?: any; android?: any }): void {
  applyNativeEscapeProps(view, isIOS ? props.ios : isAndroid ? props.android : undefined)
}

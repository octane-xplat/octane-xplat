import type { NativeGestureSurface, NativeGestureView } from './input.native'

/** Unsupported hosts must not install silent gesture placeholders. */
export function nativeGestureSurface(_view: NativeGestureView): NativeGestureSurface {
  throw new Error('Unsupported gesture attachment: this host has no qualified raw-contact adapter')
}

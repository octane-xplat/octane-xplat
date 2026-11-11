import type { NativeGestureView } from './input.native'

/** Loaded can precede insertion into the OS window, especially for hidden children. */
export function nativeInputReady(view: NativeGestureView): boolean {
  if (view.isLoaded === false) {
    return false
  }

  const native = view.nativeViewProtected

  if (!native || typeof native !== 'object') {
    return false
  }

  if ('isAttachedToWindow' in native && typeof native.isAttachedToWindow === 'function') {
    return native.isAttachedToWindow() === true
  }

  if ('window' in native) {
    return native.window != null
  }

  if ('XamlRoot' in native) {
    return native.XamlRoot != null
  }

  // Non-mobile adapters/object drivers still validate their own surface type.
  return true
}

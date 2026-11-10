import { View } from '@nativescript/core'
import type { NativeGestureView } from './input.native'
import type { PressRegistration } from './owner'
import type { PressOptions } from './press'
import type { NativePressTransport } from './native-press-contract'

export type { NativePressTransport } from './native-press-contract'

interface NativeActivation {
  readonly android?: unknown
  readonly ios?: { readonly numberOfTouches: number }
}

/** Keep native semantic activation and double/long recognition; pointer eligibility belongs to the owner. */
export function observeNativePress(
  view: NativeGestureView,
  registration: PressRegistration,
  options: PressOptions,
): NativePressTransport {
  const tap = (value: unknown) => {
    // The SDK erases the gesture payload from Observable's callback type.
    const event = value as NativeActivation
    const source = event.android || (event.ios?.numberOfTouches ?? 0) > 0 ? 'pointer' : 'virtual'

    registration.activate(source)
  }

  const double = () => {
    registration.activate('pointer', undefined, 'double')
  }

  // Native recognition can precede the raw observer's final up in the same OS delivery.
  const deferredDouble = () => {
    queueMicrotask(double)
  }

  const long = () => {
    registration.longPress('pointer')
  }

  // Mason aliases tap to click. Use the SDK's semantic recognizers, not that alias.
  let hasDouble = false,
    hasLong = false,
    alive = true

  const update = (next: PressOptions) => {
    const doubleEnabled = Boolean(next.onDoublePress),
      longEnabled = Boolean(next.onLongPress) && next.longPressDelay == null

    if (doubleEnabled !== hasDouble) {
      if (doubleEnabled) {
        View.prototype.addEventListener.call(view, 'doubleTap', deferredDouble)
      } else {
        View.prototype.removeEventListener.call(view, 'doubleTap', deferredDouble)
      }

      hasDouble = doubleEnabled
    }

    if (longEnabled !== hasLong) {
      if (longEnabled) {
        View.prototype.addEventListener.call(view, 'longPress', long)
      } else {
        View.prototype.removeEventListener.call(view, 'longPress', long)
      }

      hasLong = longEnabled
    }
  }

  View.prototype.addEventListener.call(view, 'tap', tap)

  const dispose = () => {
    if (!alive) {
      return
    }

    alive = false
    View.prototype.removeEventListener.call(view, 'tap', tap)
    View.prototype.removeEventListener.call(view, 'doubleTap', deferredDouble)
    View.prototype.removeEventListener.call(view, 'longPress', long)
  }

  try {
    update(options)
  } catch (error) {
    dispose()
    throw error
  }

  return {
    commit(next: PressOptions) {
      if (alive) {
        update(next)
      }
    },
    dispose,
  }
}

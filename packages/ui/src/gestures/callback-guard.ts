import type { PressOptions } from './press'
import type { InteractionHostOptions } from './host-options'

export type InputCallbackGuard = <A extends unknown[]>(
  callback: ((...args: A) => void) | undefined,
  ...args: A
) => boolean

/** Invoke input callbacks so host errors enter the mounted renderer boundary
 *  after synchronous input cleanup. `fail` delivers the error to the owner's
 *  state; a retired owner cannot receive a state update, so its errors are
 *  rethrown on a microtask instead. */
export function createInputCallbackGuard(fail: (failure: { error: unknown }) => void) {
  let alive = true,
    pending = false

  const report = (error: unknown) => {
    if (!alive) {
      queueMicrotask(() => {
        throw error
      })

      return
    }

    if (pending) {
      return
    }

    pending = true
    queueMicrotask(() => {
      if (alive) {
        fail({ error })
      } else {
        throw error
      }
    })
  }

  const invoke: InputCallbackGuard = (callback, ...args) => {
    try {
      callback?.(...args)
      return true
    } catch (error) {
      report(error)
      return false
    }
  }

  return {
    invoke,
    retire() {
      alive = false
    },
  }
}

export type InputCallbackGuardState = ReturnType<typeof createInputCallbackGuard>

function guardedPress(
  options: PressOptions | undefined,
  invoke: InputCallbackGuard,
): PressOptions | undefined {
  if (!options) {
    return undefined
  }

  return {
    ...options,
    onPress: options.onPress
      ? (event) => {
          invoke(options.onPress, event)
        }
      : undefined,
    onDoublePress: options.onDoublePress
      ? () => {
          invoke(options.onDoublePress)
        }
      : undefined,
    onLongPress: options.onLongPress
      ? () => {
          invoke(options.onLongPress)
        }
      : undefined,
    onPressIn: options.onPressIn
      ? (sample) => {
          if (!invoke(options.onPressIn, sample)) {
            sample?.session.cancel()
          }
        }
      : undefined,
    onPressOut: options.onPressOut
      ? (sample) => {
          invoke(options.onPressOut, sample)
        }
      : undefined,
  }
}

/** Route an interaction host's callbacks through `invoke`; a failing pan,
 *  pinch, or press-in callback cancels its gesture session. */
export function guardInteractionCallbacks(
  options: InteractionHostOptions,
  invoke: InputCallbackGuard,
): InteractionHostOptions {
  return {
    ...options,
    press: guardedPress(options.press, invoke),
    onPan: options.onPan
      ? (event) => {
          if (!invoke(options.onPan, event) && event.phase !== 'finish') {
            event.sample.session.cancel()
          }
        }
      : undefined,
    onPinch: options.onPinch
      ? (event) => {
          if (!invoke(options.onPinch, event) && event.phase !== 'finish') {
            event.sample.session.cancel()
          }
        }
      : undefined,
  }
}

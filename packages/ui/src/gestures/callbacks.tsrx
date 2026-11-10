import { useCallback, useInsertionEffect, useRef, useState } from 'octane'
import type { GestureCallbacks, GestureSample } from './types'
import type { PressOptions } from './press'
import type { InteractionHostOptions } from './host-options'

export type InputCallbackGuard = <A extends unknown[]>(
  callback: ((...args: A) => void) | undefined,
  ...args: A
) => boolean

/** External host errors enter the mounted renderer boundary after synchronous
 * input cleanup. A retired owner cannot receive a state update. */
export function useInputCallbackGuard(): InputCallbackGuard {
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const alive = useRef(true),
    pending = useRef(false)

  useInsertionEffect(
    () => () => {
      alive.current = false
    },
    [],
  )

  if (failure) {
    throw failure.error
  }

  const report = useCallback((error: unknown) => {
    if (!alive.current) {
      queueMicrotask(() => {
        throw error
      })

      return
    }

    if (pending.current) {
      return
    }

    pending.current = true
    queueMicrotask(() => {
      if (alive.current) {
        setFailure({ error })
      } else {
        throw error
      }
    })
  }, [])

  return function invoke<A extends unknown[]>(
    callback: ((...args: A) => void) | undefined,
    ...args: A
  ): boolean {
    try {
      callback?.(...args)
      return true
    } catch (error) {
      report(error)
      return false
    }
  }
}

export function useGestureCallbacks<T extends GestureSample>(
  options: GestureCallbacks<T>,
): GestureCallbacks<T> {
  const invoke = useInputCallbackGuard()
  const call = (callback: ((sample: T) => void) | undefined, sample: T) => {
    if (!invoke(callback, sample)) {
      sample.session.cancel()
    }
  }

  return {
    onStart: (sample) => call(options.onStart, sample),
    onUpdate: (sample) => call(options.onUpdate, sample),
    onEnd: (sample) => call(options.onEnd, sample),
    onCancel: (sample, reason) => {
      invoke(options.onCancel, sample, reason)
    },
    onFinalize: (terminal) => {
      invoke(options.onFinalize, terminal)
    },
  }
}

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

export function useInteractionCallbacks(options: InteractionHostOptions): InteractionHostOptions {
  const invoke = useInputCallbackGuard()

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

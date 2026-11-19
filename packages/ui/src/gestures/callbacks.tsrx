import { useInsertionEffect, useRef, useState } from 'octane'
import type { GestureCallbacks, GestureSample } from './types'
import type { InteractionHostOptions } from './host-options'
import {
  createInputCallbackGuard,
  guardInteractionCallbacks,
  type InputCallbackGuard,
  type InputCallbackGuardState,
} from './callback-guard'

export type { InputCallbackGuard } from './callback-guard'

/** External host errors enter the mounted renderer boundary after synchronous
 * input cleanup. A retired owner cannot receive a state update. */
export function useInputCallbackGuard(): InputCallbackGuard {
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const ref = useRef<InputCallbackGuardState | null>(null)

  if (!ref.current) {
    ref.current = createInputCallbackGuard(setFailure)
  }

  const guard = ref.current

  useInsertionEffect(() => guard.retire, [guard])

  if (failure) {
    throw failure.error
  }

  return guard.invoke
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

export function useInteractionCallbacks(options: InteractionHostOptions): InteractionHostOptions {
  return guardInteractionCallbacks(options, useInputCallbackGuard())
}

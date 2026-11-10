import { derived$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { useInsertionEffect, useLayoutEffect, useRef } from 'octane'
import {
  createPanController,
  createPinchController,
  type PanController,
  type PinchController,
  type GestureCells,
  type GestureState,
} from './controller'

import type {
  PanGesture,
  PanGestureOptions,
  PanSample,
  PinchGesture,
  PinchGestureOptions,
  PinchSample,
} from './types'

// Local declarations follow renderer-owned allocation and retirement semantics.
function useGestureCells$<T>(): GestureCells<T> {
  const state$ = useSignal$<GestureState<T>>({ phase: 'idle', pointerCount: 0, sample: null })
  const phase$ = derived$(() => state$.get().phase)
  const active$ = derived$(() => state$.get().phase === 'active')
  const pointerCount$ = derived$(() => state$.get().pointerCount)
  const sample$ = derived$(() => state$.get().sample)

  return { state$, phase$, active$, pointerCount$, sample$ }
}

/** Create a stable drag recognizer; callback updates never reattach the recognizer. */
export function usePanGesture$(options: PanGestureOptions): PanGesture {
  const cells = useGestureCells$<PanSample>()
  const ref = useRef<PanController | null>(null)

  if (!ref.current || ref.current.disposed) {
    ref.current = createPanController(options, cells)
  }

  const controller = ref.current

  useInsertionEffect(() => () => controller.dispose(), [controller])
  useLayoutEffect(() => controller.commit(options), [controller, options])
  return controller.handle
}

/** Create a stable two-contact pinch with cumulative scale and explicit cancellation. */
export function usePinchGesture$(options: PinchGestureOptions): PinchGesture {
  const cells = useGestureCells$<PinchSample>()
  const ref = useRef<PinchController | null>(null)

  if (!ref.current || ref.current.disposed) {
    ref.current = createPinchController(options, cells)
  }

  const controller = ref.current

  useInsertionEffect(() => () => controller.dispose(), [controller])
  useLayoutEffect(() => controller.commit(options), [controller, options])
  return controller.handle
}

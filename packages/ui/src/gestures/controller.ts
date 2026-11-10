import {
  createScope,
  SIGNAL_BINDING_SUBSCRIBE,
  type Scope,
  type SignalHandle,
  type WritableSignal,
} from 'octane/signals'

import type {
  CancelReason,
  GestureHandle,
  GesturePhase,
  GestureSample,
  PanGesture,
  PanGestureOptions,
  PanSample,
  PinchGesture,
  PinchGestureOptions,
  PinchSample,
} from './types'

let nextId = 0

export type GestureState<T> = { phase: GesturePhase; pointerCount: number; sample: T | null }
export interface GestureCells<T> {
  state$: WritableSignal<GestureState<T>>
  phase$: SignalHandle<GesturePhase>
  active$: SignalHandle<boolean>
  pointerCount$: SignalHandle<number>
  sample$: SignalHandle<T | null>
}

export type GestureOptions = PanGestureOptions | PinchGestureOptions
export type GestureController = PanController | PinchController
export type PanController = Controller<PanSample, PanGestureOptions, 'pan'>
export type PinchController = Controller<PinchSample, PinchGestureOptions, 'pinch'>

const panControllers = new WeakMap<PanGesture, PanController>()
const pinchControllers = new WeakMap<PinchGesture, PinchController>()

export function validateGestureOptions(options: GestureOptions) {
  if (options.enabled !== undefined && options.enabled$ !== undefined) {
    throw new Error('Specify enabled or enabled$, not both')
  }

  if (options.samples !== undefined && !['none', 'frame', 'input'].includes(options.samples)) {
    throw new Error('Unknown gesture sample publication mode')
  }

  if ('axis' in options) {
    if (!['x', 'y', 'both'].includes(options.axis)) {
      throw new Error('Unknown pan axis')
    }

    const distance = options.activation?.distance ?? 8
    const dominance = options.activation?.dominance ?? 1.2
    const min = options.pointers?.min ?? 1,
      max = options.pointers?.max ?? 1

    if (
      !Number.isFinite(distance) ||
      distance < 0 ||
      !Number.isFinite(dominance) ||
      dominance < 1
    ) {
      throw new Error('Pan distance must be finite and nonnegative; dominance must be at least one')
    }

    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
      throw new Error('Pan pointer limits must be positive integers with min <= max')
    }
  }

  if (options.enabled$ && typeof options.enabled$.get() !== 'boolean') {
    throw new Error('enabled$ must be a ready synchronous boolean signal')
  }
}

class Controller<T extends GestureSample, O extends GestureOptions, K extends 'pan' | 'pinch'> {
  readonly handle: GestureHandle<T, K>
  readonly scope: Scope | null
  readonly state$
  disposed = false
  owner: object | null = null
  invalidate: ((reason: CancelReason) => void) | null = null
  private unsubscribe: (() => void) | null = null
  private unsubscribeRetirement: (() => void) | null = null
  private signalsRetired = false

  readonly kind: K
  options: O

  constructor(kind: K, options: O, cells?: GestureCells<T>) {
    this.kind = kind
    this.options = options
    validateGestureOptions(options)
    nextId++
    this.scope = cells ? null : createScope({ scopeKey: `xplat:gesture:${nextId}` })

    let owned: GestureCells<T>

    if (cells) {
      owned = cells
    } else {
      const scope = this.scope

      if (!scope) {
        throw new Error('A gesture controller requires owned signal cells')
      }

      const state$ = scope.signal$<GestureState<T>>('state', {
        phase: 'idle',
        pointerCount: 0,
        sample: null,
      })

      owned = {
        state$,
        phase$: scope.derived$('phase', () => state$.get().phase),
        active$: scope.derived$('active', () => state$.get().phase === 'active'),
        pointerCount$: scope.derived$('pointerCount', () => state$.get().pointerCount),
        sample$: scope.derived$('sample', () => state$.get().sample),
      }
    }

    this.state$ = owned.state$
    this.handle = Object.freeze({
      id: `gesture:${nextId}`,
      kind,
      phase$: owned.phase$,
      active$: owned.active$,
      pointerCount$: owned.pointerCount$,
      sample$: options.samples && options.samples !== 'none' ? owned.sample$ : null,
    })
  }

  enabled(): boolean {
    const value = this.options.enabled$
      ? this.options.enabled$.get()
      : (this.options.enabled ?? true)

    if (typeof value !== 'boolean') {
      throw new Error('enabled$ must remain a ready synchronous boolean signal')
    }

    return value
  }

  commit(options: O) {
    validateGestureOptions(options)
    // Publication mode defines the shape of the stable handle, not recognition configuration.
    if ((options.samples ?? 'none') !== (this.options.samples ?? 'none')) {
      throw new Error('Gesture sample publication mode cannot change during a hook instance')
    }

    const changedSource = this.options.enabled$ !== options.enabled$

    this.options = options
    if (changedSource && this.owner) {
      this.observeEnablement()
    }

    if (!this.enabled()) {
      this.invalidate?.('disabled')
    }
  }

  attach(owner: object, invalidate: (reason: CancelReason) => void) {
    if (this.disposed) {
      throw new Error('Cannot attach a disposed gesture')
    }

    if (this.owner) {
      throw new Error('A gesture handle may attach to only one host')
    }

    this.owner = owner
    this.invalidate = invalidate
    try {
      this.unsubscribeRetirement = this.state$[SIGNAL_BINDING_SUBSCRIBE](
        () => {},
        () => {
          // Octane retires local cells before effect/ref cleanup. Finalize the
          // interaction from its retained sample without writing into that owner.
          this.signalsRetired = true
          this.dispose()
        },
      )

      this.observeEnablement()
    } catch (error) {
      this.detach()
      throw error
    }
  }

  detach() {
    this.unsubscribeRetirement?.()
    this.unsubscribeRetirement = null
    this.unsubscribe?.()
    this.unsubscribe = null
    this.owner = null
    this.invalidate = null
  }

  private observeEnablement() {
    this.unsubscribe?.()
    this.unsubscribe =
      this.options.enabled$?.subscribe(() => {
        if (!this.enabled()) {
          this.invalidate?.('disabled')
        }
      }) ?? null
  }

  publish(phase: GesturePhase, pointerCount: number, sample?: T | null) {
    if (this.signalsRetired || this.disposed) {
      return
    }

    const previous = this.state$.get()

    if (
      previous.phase === phase &&
      previous.pointerCount === pointerCount &&
      (sample === undefined || previous.sample === sample)
    ) {
      return
    }

    this.state$.set({
      phase,
      pointerCount,
      sample: sample === undefined ? previous.sample : sample,
    })
  }

  dispose() {
    if (this.disposed) {
      return
    }

    try {
      this.invalidate?.('detached')
    } finally {
      this.disposed = true
      this.detach()
      this.scope?.dispose()
    }
  }
}

export function createPanController(
  options: PanGestureOptions,
  cells?: GestureCells<PanSample>,
): PanController {
  const result = new Controller<PanSample, PanGestureOptions, 'pan'>('pan', options, cells)

  panControllers.set(result.handle, result)
  return result
}

export function createPinchController(
  options: PinchGestureOptions,
  cells?: GestureCells<PinchSample>,
): PinchController {
  const result = new Controller<PinchSample, PinchGestureOptions, 'pinch'>('pinch', options, cells)

  pinchControllers.set(result.handle, result)
  return result
}

export function gestureController(handle: PanGesture | PinchGesture): GestureController {
  const result = handle.kind === 'pan' ? panControllers.get(handle) : pinchControllers.get(handle)

  if (!result) {
    throw new Error('Gesture handles must be created by a gesture hook')
  }

  return result
}

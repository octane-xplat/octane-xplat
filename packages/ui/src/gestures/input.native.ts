import {
  createGestureOwner,
  type GestureOwner,
  type GestureScheduler,
  type GestureSpace,
  type InputFrame,
} from './owner'

import type { GestureInput } from './types'

/** Minimal native-host boundary; shared ownership never imports a platform runtime. */
export interface NativeGestureView {
  readonly nativeViewProtected: unknown
  readonly style: object
  on(event: string, listener: (event: unknown) => void): void
  off(event: string, listener: (event: unknown) => void): void
}

/** A platform input adapter must keep the same root and host identities for its lifetime. */
export interface NativeGestureSurface {
  readonly root: object
  readonly host: object
  readonly space: GestureSpace
  readonly scheduler: GestureScheduler
  observe(dispatch: (frame: InputFrame, eventIdentity: string) => void): () => void
  reserve(input: GestureInput): () => void
}

interface NativeRoot {
  readonly owner: GestureOwner
  readonly surfaces: Set<object>
  lastEvent: string | null
}

const roots = new WeakMap<object, NativeRoot>()

/** Deduplicate a native event delivered through several ancestor touch observers. */
export function attachNativeGesture(
  surface: NativeGestureSurface,
  input: GestureInput,
): () => void {
  let root = roots.get(surface.root)

  if (!root) {
    root = { owner: createGestureOwner(surface.scheduler), surfaces: new Set(), lastEvent: null }
    roots.set(surface.root, root)
  }

  const current = root
  const registration = {}
  let releaseRegistration: (() => void) | null = null
  let releaseReservation: (() => void) | null = null
  let releaseObserver: (() => void) | null = null
  const release = () => {
    try {
      releaseObserver?.()
    } finally {
      releaseObserver = null
      try {
        releaseRegistration?.()
      } finally {
        releaseRegistration = null
        try {
          releaseReservation?.()
        } finally {
          releaseReservation = null
          current.surfaces.delete(registration)
          if (!current.surfaces.size) {
            try {
              current.owner.dispose()
            } finally {
              roots.delete(surface.root)
            }
          }
        }
      }
    }
  }

  try {
    releaseRegistration = current.owner.register(surface.host, input, surface.space)
    releaseReservation = surface.reserve(input)
    current.surfaces.add(registration)
    releaseObserver = surface.observe((frame, eventIdentity) => {
      if (current.lastEvent === eventIdentity) {
        return
      }

      current.lastEvent = eventIdentity
      current.owner.dispatch(frame)
    })
  } catch (error) {
    release()
    throw error
  }

  let alive = true

  return () => {
    if (alive) {
      alive = false
      release()
    }
  }
}

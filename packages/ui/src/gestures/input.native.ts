import {
  createGestureOwner,
  type GestureOwner,
  type GestureScheduler,
  type GestureSpace,
  type InputFrame,
} from './owner'

import { createNativeContactStream, type NativeContactStream } from './native-contact-stream'
import type { GestureInput, Point, InteractionScope } from './types'
import type { PressOptions } from './press'
import type { NativePressTransport } from './native-press'
import type { PressRegistration } from './owner'
import { interactionScopeController, type SuspensionDriver } from './scope'
import { observeGesturePolicy } from './gesture-policy'
import {
  createScrollPolicyRegistry,
  unrestrictedScroll,
  suspendedScroll,
  type ScrollPolicyRegistry,
  type ScrollPolicy,
} from './scroll-policy'

/** Minimal native-host boundary; shared ownership never imports a platform runtime. */
export interface NativeGestureNode {
  readonly nativeViewProtected?: unknown
  readonly parent?: NativeGestureNode | null
  readonly accessibilityRole?: unknown
}

export interface NativeGestureView extends NativeGestureNode {
  readonly nativeViewProtected?: unknown
  readonly style: object
  readonly isLoaded?: boolean
  elementFromPoint?(x: number, y: number): NativeGestureNode | null
  getActualSize?(): { width: number; height: number }
  eachChild?(callback: (child: NativeGestureView) => boolean): void
  getLocationInWindow?(): Point | undefined
  getLocationOnScreen?(): Point | undefined
  on(event: string, listener: (event: unknown) => void): void
  off(event: string, listener: (event: unknown) => void): void
}

/** A platform input adapter must keep the same root and host identities for its lifetime. */
export interface NativeGestureSurface {
  readonly root: object
  readonly host: object
  readonly space: GestureSpace
  readonly parentBasis?: GestureSpace['freeze']
  readonly scheduler: GestureScheduler
  observe(dispatch: (frame: InputFrame, eventIdentity: string) => void): () => void
  reserve(input: GestureInput): () => void
  containsHost?(host: object): boolean
  containsPoint?(point: Point): boolean
  writePolicy?(policy: ScrollPolicy): void
  suspension?: SuspensionDriver
}

interface NativeHost {
  readonly surface: NativeGestureSurface
  count: number
  release(): void
}

interface NativeRoot {
  readonly owner: GestureOwner
  readonly presses: Set<PressRegistration>
  readonly stream: NativeContactStream
  readonly hosts: Map<object, NativeHost>
  readonly policies: ScrollPolicyRegistry<object>
  lastEvent: string | null
}

const roots = new WeakMap<object, NativeRoot>()

/** Framework motion channels use the parent's plane, while positions remain local to the host. */
export function parentGestureSurface(surface: NativeGestureSurface): NativeGestureSurface {
  if (!surface.parentBasis) {
    throw new Error('Unsupported gesture attachment: parent coordinate basis unavailable')
  }

  return { ...surface, space: { ...surface.space, freeze: surface.parentBasis } }
}

/** Private adapter ingress. Native observers and dispatch-only fixtures use the
 * same cohort reconciliation; this is not evidence of OS input delivery. */
export function dispatchNativeGestureInput(
  root: object,
  frame: InputFrame,
  identity: string,
): boolean {
  const current = roots.get(root)

  if (!current || current.lastEvent === identity) {
    return false
  }

  current.lastEvent = identity
  current.stream.dispatch(frame)
  return true
}

function retain(surface: NativeGestureSurface) {
  let root = roots.get(surface.root)

  if (!root) {
    const hosts = new Map<object, NativeHost>()
    const owner = createGestureOwner({
      frame: (callback) => surface.scheduler.frame(callback),
      delay: surface.scheduler.delay
        ? (callback, milliseconds) => surface.scheduler.delay!(callback, milliseconds)
        : undefined,
      error: (error) => surface.scheduler.error(error),
      // A root can contain hosts with different native claim mechanisms. Never
      // retain the first surface's claim callback for all later registrations.
      claim(host) {
        const current = hosts.get(host)

        return current ? (current.surface.scheduler.claim?.(host) ?? true) : false
      },
    })
    const presses = new Set<PressRegistration>()

    root = {
      owner,
      presses,
      stream: createNativeContactStream((frame) => {
        owner.dispatch(frame)
        if (frame.type === 'up' && !frame.contacts.length) {
          for (const press of Array.from(presses)) {
            press.activate('pointer')
          }
        }
      }),
      hosts,
      policies: createScrollPolicyRegistry(
        (ancestor, descendant) =>
          ancestor === descendant ||
          Boolean(hosts.get(ancestor)?.surface.containsHost?.(descendant)),
      ),
      lastEvent: null,
    }

    roots.set(surface.root, root)
  }

  const current = root
  let record = current.hosts.get(surface.host)

  if (record) {
    record.count++
  } else {
    let offPolicy: (() => void) | null = null
    let offObserver: (() => void) | null = null
    let offTarget: (() => void) | null = null

    record = {
      surface,
      count: 1,
      release() {
        try {
          offObserver?.()
        } finally {
          try {
            offPolicy?.()
          } finally {
            offTarget?.()
          }
        }
      },
    }

    current.hosts.set(surface.host, record)
    try {
      offTarget = current.owner.registerTarget(surface.host, surface.space.target)
      if (surface.writePolicy) {
        offPolicy = current.policies.register({
          host: surface.host,
          apply: (policy) => surface.writePolicy!(policy),
        })
      }

      offObserver = surface.observe((frame, identity) => {
        dispatchNativeGestureInput(surface.root, frame, identity)
      })
    } catch (error) {
      current.hosts.delete(surface.host)
      try {
        record.release()
      } finally {
        if (!current.hosts.size) {
          roots.delete(surface.root)
          current.owner.dispose()
        }
      }

      throw error
    }
  }

  let alive = true

  return {
    root: current,
    release() {
      if (!alive) {
        return
      }

      alive = false

      const record = current.hosts.get(surface.host)

      if (!record || --record.count) {
        return
      }

      current.hosts.delete(surface.host)
      try {
        record.release()
      } finally {
        if (!current.hosts.size) {
          roots.delete(surface.root)
          try {
            current.stream.cancel('detached')
          } finally {
            current.owner.dispose()
          }
        }
      }
    },
  }
}

/** One raw native observer per host, independent of callback and participant updates. */
export function attachNativeGesture(
  surface: NativeGestureSurface,
  input: GestureInput,
): () => void {
  const retained = retain(surface)
  let offGesture: (() => void) | null = null
  let offPolicy: (() => void) | null = null
  let alive = true
  const release = () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      offGesture?.()
    } finally {
      try {
        offPolicy?.()
      } finally {
        retained.release()
      }
    }
  }

  try {
    offGesture = retained.root.owner.register(surface.host, input, surface.space)
    if (surface.writePolicy) {
      const reservation = retained.root.policies.reserve(surface.host, unrestrictedScroll)
      let observe: (() => void) | null = null

      offPolicy = () => {
        try {
          observe?.()
        } finally {
          reservation.release()
        }
      }

      observe = observeGesturePolicy(input, (policy) => reservation.update(policy))
    } else {
      offPolicy = surface.reserve(input)
    }
  } catch (error) {
    release()
    throw error
  }

  return release
}

/** Managed viewports observe contacts even when no app gesture is attached. */
export function registerNativeGestureViewport(surface: NativeGestureSurface): () => void {
  if (!surface.writePolicy) {
    throw new Error('Unsupported scroll viewport: missing input policy')
  }

  return retain(surface).release
}

export function attachNativeInteractionScope(
  surface: NativeGestureSurface,
  scope: InteractionScope,
): () => void {
  const retained = retain(surface)
  let detach: () => void

  try {
    detach = interactionScopeController(scope).attach({
      covers(member) {
        let host: unknown = member

        if ('nativeViewProtected' in member) {
          host = member.nativeViewProtected
        }

        return (
          host !== null &&
          typeof host === 'object' &&
          (host === surface.host || Boolean(surface.containsHost?.(host)))
        )
      },
      freeze() {
        const reservation = retained.root.policies.reserve(surface.host, suspendedScroll)
        let result: ReturnType<SuspensionDriver['freeze']>

        try {
          result = surface.suspension?.freeze() ?? { ok: false, reason: 'unsupported' }
        } catch (error) {
          reservation.release()
          throw error
        }

        if (!result.ok) {
          reservation.release()
          return result
        }

        const frozen = result
        let unblock: (() => void) | null = null
        const release = () => {
          try {
            unblock?.()
            frozen.release()
          } finally {
            reservation.release()
          }
        }

        try {
          unblock = retained.root.owner.suspendWhere(
            (host) => host === surface.host || Boolean(surface.containsHost?.(host)),
          )
        } catch (error) {
          release()
          throw error
        }

        return { ok: true, release }
      },
    })
  } catch (error) {
    retained.release()
    throw error
  }

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      detach()
    } finally {
      retained.release()
    }
  }
}

export function attachNativePress(
  surface: NativeGestureSurface,
  options: PressOptions,
  observe: (registration: PressRegistration, options: PressOptions) => NativePressTransport,
) {
  const retained = retain(surface)
  let press: PressRegistration | null = null
  let semantic: NativePressTransport | null = null
  let alive = true
  const dispose = () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      semantic?.dispose()
    } finally {
      try {
        if (press) {
          retained.root.presses.delete(press)
        }

        press?.dispose()
      } finally {
        retained.release()
      }
    }
  }

  try {
    press = retained.root.owner.registerPress(
      surface.host,
      options,
      surface.space,
      (point) => surface.containsPoint?.(point) ?? false,
    )

    retained.root.presses.add(press)
    semantic = observe(press, options)
  } catch (error) {
    dispose()
    throw error
  }

  const registration = press

  return {
    commit(next: PressOptions) {
      registration.commit(next)
      semantic?.commit(next)
    },
    dispose,
  }
}

export type NativePressBinding = ReturnType<typeof attachNativePress>

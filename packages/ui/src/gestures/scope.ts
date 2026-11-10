import { SIGNAL_BINDING_SUBSCRIBE, type SignalHandle, type WritableSignal } from 'octane/signals'
import type { InteractionScope, SuspendResult } from './types'

/** Host adapters must preflight and roll back their own partial native mutations. */
export interface SuspensionDriver {
  covers?(host: object): boolean
  freeze(): { ok: true; release(): void } | { ok: false; reason: 'unsupported' }
}

export interface ScopeController {
  readonly handle: InteractionScope
  covers(host: object): boolean
  registerMember(host: object): () => void
  attach(driver: SuspensionDriver): () => void
  dispose(): void
}

const controllers = new WeakMap<InteractionScope, ScopeController>()

/** Scope leases count ownership, never saved native booleans. */
export function createInteractionScope(
  state$: WritableSignal<boolean>,
  suspended$: SignalHandle<boolean>,
): ScopeController {
  let driver: SuspensionDriver | null = null
  let restore: (() => void) | null = null
  let disposed = false
  let retired = false
  let acquiring = false
  let restoring = false
  let suspended = false
  let generation = 0
  const leases = new Set<object>()
  const members = new Map<object, number>()
  let unsubscribe: (() => void) | null = null

  function clear() {
    generation++
    leases.clear()

    const release = restore

    restore = null

    const wasRestoring = restoring

    restoring = true
    try {
      release?.()
    } finally {
      restoring = wasRestoring
      if (suspended) {
        suspended = false
        if (!retired) {
          state$.set(false)
        }
      }
    }
  }

  const handle: InteractionScope = Object.freeze({
    suspended$,
    suspend(): SuspendResult {
      if (disposed || !driver) {
        return { ok: false, reason: 'detached' }
      }

      if (acquiring || restoring) {
        return { ok: false, reason: 'busy' }
      }

      const identity = generation
      const current = driver

      if (!leases.size) {
        if ([...members.keys()].some((host) => !current.covers?.(host))) {
          return { ok: false, reason: 'unsupported' }
        }

        acquiring = true

        let result: ReturnType<SuspensionDriver['freeze']>

        try {
          result = current.freeze()
        } finally {
          acquiring = false
        }

        if (!result.ok) {
          return result
        }

        if (driver !== current || disposed || generation !== identity) {
          result.release()
          return { ok: false, reason: 'detached' }
        }

        restore = () => result.release()
      }

      const token = {}

      leases.add(token)

      const lease = Object.freeze({
        release() {
          if (!leases.delete(token)) {
            return
          }

          if (!leases.size) {
            clear()
          }
        },
      })

      suspended = true
      try {
        state$.set(true)
      } catch (error) {
        lease.release()
        throw error
      }

      if (driver !== current || disposed || generation !== identity) {
        return { ok: false, reason: 'detached' }
      }

      return { ok: true, lease }
    },
  })

  const result: ScopeController = {
    handle,
    covers(host) {
      return Boolean(driver?.covers?.(host))
    },
    registerMember(host) {
      if (disposed) {
        throw new Error('Cannot join a disposed interaction scope')
      }

      if (leases.size && !driver?.covers?.(host)) {
        throw new Error(
          'Unsupported interaction scope: a portal cannot enter a suspended subtree outside its input coverage',
        )
      }

      members.set(host, (members.get(host) ?? 0) + 1)

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false

        const count = members.get(host) ?? 0

        if (count <= 1) {
          members.delete(host)
        } else {
          members.set(host, count - 1)
        }
      }
    },
    attach(next) {
      if (disposed || driver) {
        throw new Error('An interaction scope may attach to only one host')
      }

      driver = next
      unsubscribe = state$[SIGNAL_BINDING_SUBSCRIBE](
        () => {},
        () => {
          retired = true
          result.dispose()
        },
      )

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false
        driver = null
        try {
          clear()
        } finally {
          unsubscribe?.()
          unsubscribe = null
        }
      }
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      members.clear()
      try {
        clear()
      } finally {
        driver = null
        unsubscribe?.()
        unsubscribe = null
      }
    },
  }

  controllers.set(handle, result)
  return result
}

export function interactionScopeController(handle: InteractionScope): ScopeController {
  const result = controllers.get(handle)

  if (!result) {
    throw new Error('Interaction scopes must be created by useInteractionScope$')
  }

  return result
}

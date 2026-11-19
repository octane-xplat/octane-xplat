import { interactionScopeController } from './scope'
import type { InteractionScope } from './types'

/** Framework ownership of one host within its enclosing interaction scopes,
 *  tracked through portals independently of native physical ancestry. */
export function createInteractionMembership(initial: readonly InteractionScope[]) {
  let host: object | null = null
  let releases: (() => void)[] = []
  let committed = initial

  function clear() {
    const owned = releases

    releases = []
    for (const release of owned.reverse()) {
      release()
    }
  }

  function sync() {
    clear()
    if (!host) {
      return
    }

    try {
      for (const scope of committed) {
        releases.push(interactionScopeController(scope).registerMember(host))
      }
    } catch (error) {
      clear()
      throw error
    }
  }

  return {
    /** Host callback-ref target; registration waits for the commit to settle. */
    bind(next: object | null) {
      host = next
      clear()
      if (next) {
        queueMicrotask(sync)
      }
    },
    /** Layout-phase commit of the scopes enclosing the host. */
    commit(scopes: readonly InteractionScope[]) {
      committed = scopes
      sync()
    },
    clear,
    dispose() {
      host = null
      clear()
    },
  }
}

export type InteractionMembership = ReturnType<typeof createInteractionMembership>

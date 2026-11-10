import { sameGestureInput } from './composition'
import type { GestureInput, InteractionScope } from './types'

export interface GestureHostAdapter<Host> {
  gestures(host: Host, input: GestureInput): () => void
  scope(host: Host, scope: InteractionScope): () => void
}

/** A committed host registration; render-time objects never own native listeners. */
export function createGestureBinding<Host>(adapter: GestureHostAdapter<Host>) {
  let host: Host | null = null
  let gestures: GestureInput | undefined
  let scope: InteractionScope | undefined
  let releaseGestures: (() => void) | null = null
  let releaseScope: (() => void) | null = null

  function clearGestures() {
    const release = releaseGestures

    releaseGestures = null
    gestures = undefined
    release?.()
  }

  function clearScope() {
    const release = releaseScope

    releaseScope = null
    scope = undefined
    release?.()
  }

  function detach() {
    host = null
    try {
      clearGestures()
    } finally {
      clearScope()
    }
  }

  return {
    commit(nextHost: Host | null, nextGestures?: GestureInput, nextScope?: InteractionScope) {
      if (host !== nextHost) {
        detach()
        host = nextHost
      }

      if (!host) {
        return
      }

      if (
        gestures !== nextGestures &&
        !(gestures && nextGestures && sameGestureInput(gestures, nextGestures))
      ) {
        clearGestures()
        if (nextGestures) {
          releaseGestures = adapter.gestures(host, nextGestures)
          gestures = nextGestures
        }
      }

      if (scope !== nextScope) {
        clearScope()
        if (nextScope) {
          releaseScope = adapter.scope(host, nextScope)
          scope = nextScope
        }
      }
    },
    detach,
  }
}

export type GestureBinding<Host> = ReturnType<typeof createGestureBinding<Host>>

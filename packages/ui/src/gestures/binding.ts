import { sameGestureInput } from './composition'
import type { GestureInput, InteractionScope } from './types'

export interface GestureHostAdapter<Host> {
  gestures(host: Host, input: GestureInput): () => void
  scope(host: Host, scope: InteractionScope): () => void
}

/** A committed host registration; render-time objects never own native listeners. */
export function createGestureBinding<Host>(adapter: GestureHostAdapter<Host>) {
  let host: Host | null = null
  let gestures: GestureInput | undefined, scope: InteractionScope | undefined
  let releaseGestures: (() => void) | null = null,
    releaseScope: (() => void) | null = null

  let revision = 0
  const clearGestures = () => {
    const release = releaseGestures

    releaseGestures = null
    gestures = undefined
    release?.()
  }

  const clearScope = () => {
    const release = releaseScope

    releaseScope = null
    scope = undefined
    release?.()
  }

  function detachCurrent() {
    host = null

    const oldGestures = releaseGestures,
      oldScope = releaseScope

    releaseGestures = null
    gestures = undefined
    releaseScope = null
    scope = undefined
    try {
      oldGestures?.()
    } finally {
      oldScope?.()
    }
  }

  return {
    commit(nextHost: Host | null, nextGestures?: GestureInput, nextScope?: InteractionScope) {
      const identity = ++revision

      if (host !== nextHost || nextHost === null) {
        detachCurrent()
        if (revision !== identity) {
          return
        }

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
        if (revision !== identity) {
          return
        }

        if (nextGestures) {
          const release = adapter.gestures(host, nextGestures)

          if (revision !== identity) {
            release()
            return
          }

          releaseGestures = release
          gestures = nextGestures
        }
      }

      if (scope !== nextScope) {
        clearScope()
        if (revision !== identity) {
          return
        }

        if (nextScope) {
          const release = adapter.scope(host, nextScope)

          if (revision !== identity) {
            release()
            return
          }

          releaseScope = release
          scope = nextScope
        }
      }
    },
    detach() {
      revision++
      detachCurrent()
    },
  }
}

export type GestureBinding<Host> = ReturnType<typeof createGestureBinding<Host>>

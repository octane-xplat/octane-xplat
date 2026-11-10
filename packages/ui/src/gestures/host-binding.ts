import { createGestureBinding, type GestureHostAdapter } from './binding'
import type { GestureInput, InteractionScope } from './types'
import type { PressOptions } from './press'

export interface PressBinding {
  commit(options: PressOptions): void
  dispose(): void
}

export interface InteractionAdapter<Host> extends GestureHostAdapter<Host> {
  press(host: Host, options: PressOptions): PressBinding
  viewport(host: Host): () => void
}

export interface InteractionBindingOptions {
  readonly gestures?: GestureInput
  readonly scope?: InteractionScope
  readonly press?: PressOptions
  readonly viewport?: boolean
}

/** Every component participant commits through one host lifecycle. */
export function createInteractionBinding<Host>(adapter: InteractionAdapter<Host>) {
  const gestures = createGestureBinding(adapter)
  let host: Host | null = null
  let press: PressBinding | null = null
  let viewport: (() => void) | null = null
  let revision = 0
  function detachCurrent(identity: number) {
    host = null

    const oldPress = press,
      oldViewport = viewport

    press = null
    viewport = null
    try {
      oldPress?.dispose()
    } finally {
      try {
        // A reentrant commit entered with host=null and already detached the old gestures.
        if (revision === identity) {
          gestures.detach()
        }
      } finally {
        oldViewport?.()
      }
    }
  }

  return {
    commit(next: Host | null, options: InteractionBindingOptions) {
      const identity = ++revision

      if (next !== host || next === null) {
        detachCurrent(identity)
        if (revision !== identity) {
          return
        }

        host = next
      }

      if (!host) {
        return
      }

      gestures.commit(host, options.gestures, options.scope)
      if (revision !== identity) {
        return
      }

      if (options.press) {
        if (press) {
          press.commit(options.press)
        } else {
          const attached = adapter.press(host, options.press)

          if (revision !== identity) {
            attached.dispose()
            return
          }

          press = attached
        }
      } else {
        const old = press

        press = null
        old?.dispose()
      }

      if (revision !== identity) {
        return
      }

      if (options.viewport && !viewport) {
        const release = adapter.viewport(host)

        if (revision !== identity) {
          release()
          return
        }

        viewport = release
      } else if (!options.viewport && viewport) {
        const old = viewport

        viewport = null
        old()
      }
    },
    detach() {
      const identity = ++revision

      detachCurrent(identity)
    },
  }
}

export type InteractionBinding<Host> = ReturnType<typeof createInteractionBinding<Host>>

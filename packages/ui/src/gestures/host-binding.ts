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
  const detach = () => {
    host = null

    const oldPress = press,
      oldViewport = viewport

    press = null
    viewport = null
    try {
      oldPress?.dispose()
    } finally {
      try {
        gestures.detach()
      } finally {
        oldViewport?.()
      }
    }
  }

  return {
    commit(next: Host | null, options: InteractionBindingOptions) {
      if (next !== host) {
        detach()
        host = next
      }

      if (!host) {
        return
      }

      gestures.commit(host, options.gestures, options.scope)
      if (options.press) {
        if (press) {
          press.commit(options.press)
        } else {
          press = adapter.press(host, options.press)
        }
      } else {
        const old = press

        press = null
        old?.dispose()
      }

      if (options.viewport && !viewport) {
        viewport = adapter.viewport(host)
      } else if (!options.viewport && viewport) {
        const old = viewport

        viewport = null
        old()
      }
    },
    detach,
  }
}

export type InteractionBinding<Host> = ReturnType<typeof createInteractionBinding<Host>>

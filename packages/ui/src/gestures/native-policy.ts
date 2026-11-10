import { observeGesturePolicy, restrictTouchAction } from './gesture-policy'
import type { GestureInput } from './types'

/** Native host policy uses public CSS properties; no layout/overflow mutation. */
export function reserveNativeGesturePolicy(style: object, input: GestureInput): () => void {
  if (!('touchAction' in style)) {
    throw new Error('Unsupported gesture attachment: native host has no touch-action policy')
  }

  let authored = style.touchAction
  let written: string | null = null
  let alive = true
  let release: () => void

  try {
    release = observeGesturePolicy(input, (policy) => {
      if (!alive) {
        return
      }

      if (written !== null && style.touchAction !== written) {
        authored = style.touchAction
      }

      written = restrictTouchAction(typeof authored === 'string' ? authored : 'auto', policy)
      style.touchAction = written
    })
  } catch (error) {
    alive = false
    if (written !== null && style.touchAction === written) {
      style.touchAction = authored
    }

    throw error
  }

  return () => {
    if (!alive) {
      return
    }

    alive = false
    release()
    if (style.touchAction === written) {
      style.touchAction = authored
    }
  }
}

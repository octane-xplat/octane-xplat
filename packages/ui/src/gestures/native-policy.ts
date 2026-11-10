import { observeGesturePolicy, restrictTouchAction } from './gesture-policy'
import type { GestureInput } from './types'
import type { ScrollPolicy } from './scroll-policy'

/** Native host policy uses public CSS properties; no layout/overflow mutation. */
export function nativePolicyWriter(style: object): (policy: ScrollPolicy) => void {
  if (!('touchAction' in style)) {
    throw new Error('Unsupported gesture attachment: native host has no touch-action policy')
  }

  let authored = style.touchAction
  let written: string | null = null

  return (policy) => {
    if (written !== null && style.touchAction !== written) {
      authored = style.touchAction
    }

    if (policy.x && policy.y && policy.pinch) {
      if (written !== null && style.touchAction === written) {
        style.touchAction = authored
      }

      written = null
      return
    }

    written = restrictTouchAction(typeof authored === 'string' ? authored : 'auto', policy)
    style.touchAction = written
  }
}

export function reserveNativeGesturePolicy(style: object, input: GestureInput): () => void {
  const write = nativePolicyWriter(style)
  let release: () => void

  try {
    release = observeGesturePolicy(input, write)
  } catch (error) {
    write({ x: true, y: true, pinch: true })
    throw error
  }

  return () => {
    try {
      release()
    } finally {
      write({ x: true, y: true, pinch: true })
    }
  }
}

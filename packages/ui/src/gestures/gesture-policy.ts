import { gestureLeaves } from './composition'
import { gestureController } from './controller'
import type { GestureInput } from './types'
import type { ScrollPolicy } from './scroll-policy'

/** Reserve only enabled recognizers' axes, before native recognition begins. */
export function gestureScrollPolicy(input: GestureInput): ScrollPolicy {
  let x = true,
    y = true,
    pinch = true

  for (const handle of gestureLeaves(input)) {
    const controller = gestureController(handle)

    if (controller.disposed || !controller.enabled()) {
      continue
    }

    if (controller.kind === 'pinch') {
      x = false
      y = false
      pinch = false
    } else {
      x &&= controller.options.axis === 'y'
      y &&= controller.options.axis === 'x'
    }
  }

  return { x, y, pinch }
}

export function touchActionForPolicy(policy: ScrollPolicy): string {
  if (!policy.x && !policy.y && !policy.pinch) {
    return 'none'
  }

  if (policy.x && policy.y && policy.pinch) {
    return 'auto'
  }

  return (
    [policy.x && 'pan-x', policy.y && 'pan-y', policy.pinch && 'pinch-zoom']
      .filter(Boolean)
      .join(' ') || 'none'
  )
}

/** In-place callback updates preserve observers; only the host policy changes. */
export function observeGesturePolicy(
  input: GestureInput,
  apply: (policy: ScrollPolicy) => void,
): () => void {
  const leaves = gestureLeaves(input)
  const update = () => apply(gestureScrollPolicy(input))
  const releases = leaves.map((handle) => gestureController(handle).observeConfiguration(update))

  try {
    update()
  } catch (error) {
    for (const release of releases) {
      release()
    }

    throw error
  }

  return () => {
    for (const release of releases) {
      release()
    }
  }
}

/** Keep authored directional restrictions while reserving axes for app recognition. */
export function restrictTouchAction(authored: string, policy: ScrollPolicy): string {
  if (policy.x && policy.y && policy.pinch) {
    return authored || 'auto'
  }

  const tokens =
    !authored || authored === 'auto' || authored === 'manipulation'
      ? ['pan-x', 'pan-y', 'pinch-zoom']
      : authored.split(/\s+/)

  const kept = tokens.filter((token) =>
    /^pan-(x|left|right)$/.test(token)
      ? policy.x
      : /^pan-(y|up|down)$/.test(token)
        ? policy.y
        : token === 'pinch-zoom' && policy.pinch,
  )

  return kept.join(' ') || 'none'
}

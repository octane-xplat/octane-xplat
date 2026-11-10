import type { InteractionTarget } from './types'

const targets = new WeakMap<object, InteractionTarget>()
let nextTarget = 0

/** Stable host identity across callback/configuration updates and binding replacement. */
export function interactionTarget(host: object): InteractionTarget {
  let target = targets.get(host)

  if (!target) {
    target = Object.freeze({ id: `xplat-target:${++nextTarget}` })
    targets.set(host, target)
  }

  return target
}

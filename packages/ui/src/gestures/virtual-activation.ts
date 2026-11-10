import { interactionTarget } from './target'
import type { ActivationEvent } from './types'

/** Native semantic hosts that cannot identify a physical origin never invent pointer positions. */
export function virtualActivation(host: object): ActivationEvent {
  const target = interactionTarget(host)

  return Object.freeze({
    source: 'virtual',
    target,
    currentTarget: target,
    pointer: null,
    preventDefault() {},
  })
}

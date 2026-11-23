/** @jsxImportSource @octane-xplat/jsx */
import { motionClock } from '@octane-xplat/platform/motion-clock'
import { useEffect, useRef } from 'octane'
import { createAnimatedValue, type OwnedAnimatedValue } from './animated-value'
import type { AnimatedValue } from '../../props'

export type { AnimatedValue } from '../../props'

/**
 * Imperative numeric animation bound to a host element prop (transforms, opacity). `prop` names differ per target — see `AnimatedValue` for the per-platform property list and defaults.
 *
 * @see AnimatedValue, AnimationResult.
 */
export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
  const value = useRef<OwnedAnimatedValue | null>(null)

  if (!value.current) {
    value.current = createAnimatedValue(initial, {
      ...motionClock,
      write: (view, next) => {
        view[prop] = next
      },
    })
  }

  useEffect(() => () => value.current?.dispose(), [])
  return value.current
}

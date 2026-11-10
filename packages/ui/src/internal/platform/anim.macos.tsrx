/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { createAnimatedValue, type OwnedAnimatedValue } from './animated-value'
import { writeAnimatedProperty, readReducedMotion } from './animation-host.macos'
import type { AnimatedValue } from '../../props'

export type { AnimatedValue } from '../../props'

export function useAnimation(initial = 0, property = 'translateX'): AnimatedValue {
  const value = useRef<OwnedAnimatedValue | null>(null)

  if (!value.current) {
    value.current = createAnimatedValue(initial, {
      now: () => performance.now(),
      request: requestAnimationFrame,
      cancel: cancelAnimationFrame,
      write: (view, next) => writeAnimatedProperty(view, property, next),
      // Match motion's system policy: transforms snap, opacity may fade.
      reducedMotion: () => property !== 'opacity' && readReducedMotion(),
    })
  }

  useEffect(() => () => value.current?.dispose(), [])
  return value.current
}

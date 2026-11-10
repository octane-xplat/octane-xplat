/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useRef } from 'octane'
import { writeTransformProp } from '../layout/transform.web'
import { createAnimatedValue, type OwnedAnimatedValue } from './animated-value'
import type { AnimatedValue } from '../../props'

export type { AnimatedValue } from '../../props'

export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
  const value = useRef<OwnedAnimatedValue | null>(null)

  if (!value.current) {
    value.current = createAnimatedValue(initial, {
      now: Date.now,
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
      write: (view, next) => writeTransformProp(view, prop, next),
    })
  }

  useEffect(() => () => value.current?.dispose(), [])
  return value.current
}

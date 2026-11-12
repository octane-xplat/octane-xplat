import type { Clock } from './clock-types'
import type { MotionData } from './value-codec'
import type { MotionValue } from './value'
import type { Transition } from './types'
import type { AnimationResult } from './engine'

export type PropertyRun = {
  finished: Promise<AnimationResult>
  retarget(): void
}

/** Re-resolution replaces playback while retaining one logical completion promise. */
export function createPropertyRun<T extends MotionData>(
  clock: Clock,
  value: MotionValue<T>,
  destination: () => T,
  transition: Transition,
): PropertyRun {
  const started = clock.now()
  let generation = 0
  let settled = false
  let resolve!: (result: AnimationResult) => void
  const finished = new Promise<AnimationResult>((done) => {
    resolve = done
  })
  function start(rebase: boolean) {
    if (settled) {
      return
    }
    const to = destination()
    const elapsed = (clock.now() - started) / 1000
    const timing = { ...transition }
    if (rebase) {
      timing.delay = Math.max(0, (transition.delay ?? 0) - elapsed)
      const timeSpring =
        transition.type === 'spring' &&
        !transition.stiffness &&
        !transition.damping &&
        !transition.mass &&
        (transition.duration !== undefined || transition.bounce !== undefined)
      if ((transition.type ?? 'tween') === 'tween' || timeSpring) {
        timing.duration = Math.max(
          0,
          (transition.duration ?? (timeSpring ? 0.8 : 0.3)) -
            Math.max(0, elapsed - (transition.delay ?? 0)),
        )
      }
    }
    if (rebase && timing.duration === 0 && timing.type === 'spring') {
      timing.type = 'tween'
    }
    const current = ++generation
    const run = value.animate(to, timing)
    void run.finished.then((result) => {
      if (current !== generation || settled) {
        return
      }
      settled = true
      resolve(result)
    })
  }
  start(false)
  return {
    finished,
    retarget() {
      start(true)
    },
  }
}

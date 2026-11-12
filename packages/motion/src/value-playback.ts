import type { Clock } from './clock-types'
import { runAnimation, type AnimationControls } from './engine'
import type { Transition } from './types'
import type { MotionData, ParsedValue } from './value-codec'

/** Existing numeric generators, coalesced into one compound sample per host frame. */
export function runValueAnimation(
  clock: Clock,
  from: ParsedValue,
  to: ParsedValue,
  transition: Transition,
  velocities: number[],
  update: (value: MotionData) => void,
): AnimationControls {
  let parentFrame = 0
  let nextId = 0
  let stopped = false
  let dirty = false
  const pending = new Map<number, () => void>()
  const samples = [...from.numbers]
  const flush = () => {
    if (dirty && !stopped) {
      dirty = false
      update(to.serialize(samples))
    }
  }
  const frameClock: Clock = {
    now: () => clock.now(),
    request(callback) {
      const id = ++nextId
      pending.set(id, callback)
      if (!parentFrame) {
        parentFrame = clock.request(() => {
          parentFrame = 0
          const batch = [...pending]
          for (const [key, callback] of batch) {
            if (pending.delete(key)) {
              callback()
            }
          }
          flush()
        })
      }
      return id
    },
    cancel(id) {
      pending.delete(id)
      if (!pending.size && parentFrame) {
        clock.cancel(parentFrame)
        parentFrame = 0
      }
    },
  }
  const jobs = samples.map((value, i) =>
    runAnimation(
      frameClock,
      value,
      to.numbers[i],
      { ...transition, velocity: transition.velocity ?? velocities[i] ?? 0 },
      (sample) => {
        samples[i] = sample
        dirty = true
      },
    ),
  )
  if (!samples.length) {
    update(to.serialize([]))
  }
  flush()
  return {
    finished: Promise.all(jobs.map((job) => job.finished)).then((results) =>
      results.some((result) => result === 'replaced')
        ? 'replaced'
        : results.every((result) => result === 'finished')
          ? 'finished'
          : 'cancelled',
    ),
    stop(reason = 'cancelled') {
      stopped = true
      for (const job of jobs) {
        job.stop(reason)
      }
      pending.clear()
      clock.cancel(parentFrame)
      parentFrame = 0
    },
  }
}

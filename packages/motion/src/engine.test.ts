import { describe, expect, it } from 'vitest'
import { inertia, spring } from 'motion-dom'
import { runAnimation } from './engine'
import { MotionValue } from './value'
import { Controller } from './controller'
import type { Clock } from './clock-types'
import type { Transition } from './types'

function fakeClock() {
  let time = 0,
    id = 0

  const callbacks = new Map<number, () => void>()
  const clock: Clock = {
    now: () => time,
    request: (fn) => {
      callbacks.set(++id, fn)
      return id
    },
    cancel: (key) => {
      callbacks.delete(key)
    },
  }

  return {
    clock,
    advance(ms: number) {
      time += ms

      const pending = [...callbacks.values()]

      callbacks.clear()
      pending.forEach((fn) => fn())
    },
    count: () => callbacks.size,
  }
}

describe('portable playback', () => {
  it('uses elapsed time and reaches the exact tween endpoint after suspension', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(
      time.clock,
      0,
      100,
      { duration: 1, delay: 0.1, ease: 'linear' },
      (next) => {
        value = next
      },
    )

    time.advance(50)
    expect(value).toBe(0)
    time.advance(550)
    expect(value).toBeCloseTo(50)
    time.advance(10000)
    expect(value).toBe(100)
    expect(await controls.finished).toBe('finished')
    expect(time.count()).toBe(0)
  })

  it('matches upstream spring samples at irregular frame intervals', () => {
    const time = fakeClock()
    let value = 0
    const options = { stiffness: 180, damping: 16, mass: 2, velocity: 90 }
    const reference = spring({ ...options, keyframes: [0, 100] })

    runAnimation(time.clock, 0, 100, { ...options, type: 'spring' }, (next) => {
      value = next
    })

    let elapsed = 0

    for (const dt of [8, 16, 34, 5, 100, 10000]) {
      elapsed += dt
      time.advance(dt)

      const expected = reference.next(elapsed)

      expect(value).toBeCloseTo(expected.done ? 100 : expected.value)
    }

    expect(value).toBe(100)
  })

  it('settles cancellation once and never calls completion', async () => {
    const time = fakeClock()
    let completes = 0
    const controls = runAnimation(
      time.clock,
      0,
      1,
      {},
      () => {},
      () => {
        completes++
      },
    )

    controls.stop()
    controls.stop()
    time.advance(1000)
    expect(await controls.finished).toBe('cancelled')
    expect(completes).toBe(0)
  })

  it('preserves velocity on retarget and jump cancels/reset velocity', async () => {
    const time = fakeClock()
    const value = new MotionValue(0, time.clock)
    const first = value.animate(100, { type: 'spring' })

    time.advance(16)
    time.advance(16)
    expect(value.getVelocity()).toBeGreaterThan(0)

    const second = value.animate(0, { type: 'spring' })

    expect(await first.finished).toBe('replaced')
    value.jump(25)
    expect(value.get()).toBe(25)
    expect(value.getVelocity()).toBe(0)
    expect(await second.finished).toBe('cancelled')
    expect(time.count()).toBe(0)
  })

  it('cleans every channel on controller disposal', async () => {
    const time = fakeClock()
    const controller = new Controller(time.clock)
    const result = controller.animate({ x: 40, opacity: 0 }, { duration: 1 }, false)

    controller.destroy()
    time.advance(1000)
    expect(await result).toBe('replaced')
    expect(time.count()).toBe(0)
  })

  it('reduces positional springs immediately while preserving opacity motion', async () => {
    const time = fakeClock()
    const controller = new Controller(time.clock)
    const result = controller.animate({ x: 100, opacity: 0 }, { type: 'spring' }, true)

    expect(controller.snapshot()).toMatchObject({ x: 100, opacity: 1 })
    expect(time.count()).toBe(1)
    time.advance(10000)
    expect(await result).toBe('finished')
    expect(controller.snapshot()).toEqual({ x: 100, opacity: 0 })
    controller.destroy()
  })
})

describe('upstream-shaped transitions', () => {
  it('repeats a tween for the given number of additional legs', async () => {
    const time = fakeClock()
    const seen: number[] = []
    const controls = runAnimation(
      time.clock,
      0,
      100,
      { duration: 0.1, ease: 'linear', repeat: 1 },
      (value) => seen.push(value),
    )

    time.advance(120)
    expect(seen.at(-1)).toBe(100)
    time.advance(50)
    expect(seen.at(-1)).toBe(50)
    time.advance(120)
    expect(seen.at(-1)).toBe(100)
    expect(await controls.finished).toBe('finished')
  })

  it('reverses each repeated leg under repeatType reverse', async () => {
    const time = fakeClock()
    const seen: number[] = []
    const controls = runAnimation(
      time.clock,
      0,
      100,
      { duration: 0.1, ease: 'linear', repeat: 1, repeatType: 'reverse' },
      (value) => seen.push(value),
    )

    time.advance(120)
    time.advance(50)
    expect(seen.at(-1)).toBe(50)
    time.advance(120)
    expect(seen.at(-1)).toBe(0)
    expect(await controls.finished).toBe('finished')
  })

  it('accepts a duration/bounce spring spec', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(
      time.clock,
      0,
      100,
      { type: 'spring', duration: 0.4, bounce: 0.2 },
      (next) => {
        value = next
      },
    )

    for (let i = 0; i < 100; i++) {
      time.advance(16)
    }

    expect(await controls.finished).toBe('finished')
    expect(value).toBe(100)
  })

  it('accepts the full named-ease set on the JS engine', async () => {
    for (const ease of ['circIn', 'backOut', 'anticipate', 'circInOut', 'backInOut'] as const) {
      const time = fakeClock()
      let value = 0
      const controls = runAnimation(time.clock, 0, 50, { duration: 0.1, ease }, (next) => {
        value = next
      })

      for (let i = 0; i < 20; i++) {
        time.advance(16)
      }

      expect(await controls.finished).toBe('finished')
      expect(value).toBe(50)
    }
  })

  it('rejects fractional repeats', () => {
    const time = fakeClock()

    expect(() => runAnimation(time.clock, 0, 1, { duration: 1, repeat: 1.5 }, () => {})).toThrow(
      'repeat',
    )
  })
})

describe('inertia transitions', () => {
  const spec = {
    type: 'inertia',
    velocity: 800,
    power: 0.5,
    timeConstant: 280,
    min: -200,
    max: 500,
    bounceStiffness: 360,
    bounceDamping: 36,
    restDelta: 0.5,
  } as const

  it('matches upstream inertia samples at irregular frame intervals', () => {
    const time = fakeClock()
    let value = 0
    const reference = inertia({ keyframes: [0], ...spec })

    runAnimation(time.clock, 0, 999, spec, (next) => {
      value = next
    })

    let elapsed = 0

    for (const dt of [8, 16, 34, 5, 100, 40, 10000]) {
      elapsed += dt
      time.advance(dt)

      const expected = reference.next(elapsed)

      expect(value).toBeCloseTo(expected.value)
      if (expected.done) {
        break
      }
    }
  })

  it('ends on the bound when release velocity overshoots', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(
      time.clock,
      0,
      0,
      { ...spec, velocity: 5000, restDelta: 0.5 },
      (next) => {
        value = next
      },
    )

    for (let i = 0; i < 1000; i++) {
      time.advance(16)
      if (await Promise.race([controls.finished.then(() => true), Promise.resolve(false)])) {
        break
      }
    }

    expect(await controls.finished).toBe('finished')
    expect(Math.abs(value - 500)).toBeLessThanOrEqual(0.5)
  })

  it('writes the generator resting value, not the to argument', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(time.clock, 0, 777, { ...spec, velocity: 300 }, (next) => {
      value = next
    })

    for (let i = 0; i < 2000; i++) {
      time.advance(16)
      if (await Promise.race([controls.finished.then(() => true), Promise.resolve(false)])) {
        break
      }
    }

    expect(await controls.finished).toBe('finished')
    expect(value).not.toBe(777)
  })

  it.each([
    [{ type: 'inertia', ease: 'linear' }, 'ease'],
    [{ type: 'inertia', duration: 1 }, 'duration'],
    [{ type: 'inertia', bounce: 0.2 }, 'bounce'],
    [{ type: 'inertia', stiffness: 100 }, 'stiffness'],
    [{ type: 'inertia', damping: 10 }, 'damping'],
    [{ type: 'inertia', mass: 1 }, 'mass'],
    [{ type: 'inertia', repeat: 1 }, 'repeat'],
    [{ power: 0.5 }, 'requires an inertia'],
    [{ min: 0 }, 'requires an inertia'],
    [{ bounceStiffness: 100 }, 'requires an inertia'],
    [{ type: 'inertia', timeConstant: 0 }, 'positive'],
    [{ type: 'inertia', bounceDamping: 0 }, 'positive'],
    [{ type: 'inertia', power: -1 }, 'invalid power'],
    [{ type: 'inertia', min: 10, max: 5 }, 'min'],
  ] as const)('rejects %o with %s', (transition, pattern) => {
    const time = fakeClock()

    expect(() => runAnimation(time.clock, 0, 1, transition as any, () => {})).toThrow(pattern)
  })
})

describe('inertia transitions', () => {
  const spec = {
    type: 'inertia',
    velocity: 800,
    power: 0.5,
    timeConstant: 280,
    min: -200,
    max: 500,
    bounceStiffness: 360,
    bounceDamping: 36,
    restDelta: 0.5,
  } as const

  it('matches upstream inertia samples at irregular frame intervals', () => {
    const time = fakeClock()
    let value = 0
    const reference = inertia({ keyframes: [0], ...spec })

    runAnimation(time.clock, 0, 999, spec, (next) => {
      value = next
    })

    let elapsed = 0

    for (const dt of [8, 16, 34, 5, 100, 40, 10000]) {
      elapsed += dt
      time.advance(dt)

      const expected = reference.next(elapsed)

      expect(value).toBeCloseTo(expected.value)
      if (expected.done) {
        break
      }
    }
  })

  it('ends on the bound when release velocity overshoots', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(
      time.clock,
      0,
      0,
      { ...spec, velocity: 5000, restDelta: 0.5 },
      (next) => {
        value = next
      },
    )

    for (let i = 0; i < 1000; i++) {
      time.advance(16)
      if (await Promise.race([controls.finished.then(() => true), Promise.resolve(false)])) {
        break
      }
    }

    expect(await controls.finished).toBe('finished')
    expect(Math.abs(value - 500)).toBeLessThanOrEqual(0.5)
  })

  it('writes the generator resting value, not the to argument', async () => {
    const time = fakeClock()
    let value = 0
    const controls = runAnimation(time.clock, 0, 777, { ...spec, velocity: 300 }, (next) => {
      value = next
    })

    for (let i = 0; i < 2000; i++) {
      time.advance(16)
      if (await Promise.race([controls.finished.then(() => true), Promise.resolve(false)])) {
        break
      }
    }

    expect(await controls.finished).toBe('finished')
    expect(value).not.toBe(777)
  })

  it.each([
    [{ type: 'inertia', ease: 'linear' }, 'ease'],
    [{ type: 'inertia', duration: 1 }, 'duration'],
    [{ type: 'inertia', bounce: 0.2 }, 'bounce'],
    [{ type: 'inertia', stiffness: 100 }, 'stiffness'],
    [{ type: 'inertia', damping: 10 }, 'damping'],
    [{ type: 'inertia', mass: 1 }, 'mass'],
    [{ type: 'inertia', repeat: 1 }, 'repeat'],
    [{ power: 0.5 }, 'requires an inertia'],
    [{ min: 0 }, 'requires an inertia'],
    [{ bounceStiffness: 100 }, 'requires an inertia'],
    [{ type: 'inertia', timeConstant: 0 }, 'positive'],
    [{ type: 'inertia', bounceDamping: 0 }, 'positive'],
    [{ type: 'inertia', power: -1 }, 'invalid power'],
    [{ type: 'inertia', min: 10, max: 5 }, 'min'],
  ] as const)('rejects %o with %s', (transition, pattern) => {
    const time = fakeClock()

    expect(() => runAnimation(time.clock, 0, 1, transition as any, () => {})).toThrow(pattern)
  })
})

describe('spring mode routing (#208)', () => {
  function playback(spec: Transition) {
    const time = fakeClock()
    let value = 0
    let completions = 0
    const controls = runAnimation(
      time.clock,
      0,
      100,
      { type: 'spring', ...spec },
      (next) => {
        value = next
      },
      () => {
        completions++
      },
    )

    return { time, controls, value: () => value, completions: () => completions }
  }

  it.each([0.1, 2])(
    'finishes at duration %s seconds, rather than at visual arrival',
    async (duration) => {
      const run = playback({ duration, bounce: 0 })

      run.time.advance(duration * 500)
      expect(run.value()).toBeGreaterThan(90)
      expect(run.value()).toBeLessThan(100)
      run.time.advance(duration * 500 - 1)
      expect(run.time.count()).toBe(1)
      expect(run.completions()).toBe(0)
      run.time.advance(1)
      expect(run.value()).toBe(100)
      expect(run.time.count()).toBe(0)
      expect(run.completions()).toBe(1)
      expect(await run.controls.finished).toBe('finished')
    },
  )

  it('bounce controls overshoot, with the same completion time', async () => {
    const calm = playback({ duration: 1, bounce: 0 })
    const bouncy = playback({ duration: 1, bounce: 0.7 })
    let peak = 0

    for (let i = 0; i < 99; i++) {
      calm.time.advance(10)
      bouncy.time.advance(10)
      expect(calm.value()).toBeLessThan(100)
      peak = Math.max(peak, bouncy.value())
    }

    expect(peak).toBeGreaterThan(130)
    expect(calm.time.count()).toBe(1)
    expect(bouncy.time.count()).toBe(1)
    for (const run of [calm, bouncy]) {
      run.time.advance(10)
      expect(await run.controls.finished).toBe('finished')
      expect(run.value()).toBe(100)
    }
  })

  it.each([{ duration: 0.4 }, { bounce: 0.6 }])(
    'uses upstream time-mode defaults for %o',
    async (spec) => {
      const run = playback(spec)
      const reference = spring({
        keyframes: [0, 100],
        ...spec,
        duration: 'duration' in spec ? spec.duration! * 1000 : undefined,
      })

      let elapsed = 0

      for (const dt of [13, 87, 199, 100, 1, 399, 1]) {
        elapsed += dt
        run.time.advance(dt)
        expect(run.value()).toBeCloseTo(reference.next(elapsed).value, 8)
      }

      expect(await run.controls.finished).toBe('finished')
    },
  )

  it.each([{}, { stiffness: 180 }, { damping: 22 }, { mass: 2 }])(
    'preserves physical defaults and physical precedence for %o',
    (spec) => {
      const options = { ...spec, velocity: 90 }
      const physical = playback(options)
      const mixed = playback({
        ...options,
        ...('stiffness' in spec || 'damping' in spec || 'mass' in spec
          ? { duration: 0.1, bounce: 0.9 }
          : {}),
      })

      const reference = spring({ keyframes: [0, 100], ...options })
      let elapsed = 0

      for (const dt of [8, 16, 91, 127, 8000]) {
        elapsed += dt
        physical.time.advance(dt)
        mixed.time.advance(dt)

        const expected = reference.next(elapsed).value

        expect(physical.value()).toBeCloseTo(expected, 8)
        expect(mixed.value()).toBeCloseTo(expected, 8)
      }
    },
  )

  it('time mode ignores inherited velocity on retarget, while physical mode preserves it', async () => {
    for (const spec of [
      { duration: 0.4, bounce: 0.3 },
      { stiffness: 150, damping: 12 },
    ]) {
      const time = fakeClock()
      const value = new MotionValue(0, time.clock)
      const first = value.animate(100, { type: 'spring', ...spec })

      time.advance(30)

      const origin = value.get()
      const velocity = value.getVelocity()

      expect(velocity).toBeGreaterThan(0)

      const second = value.animate(0, { type: 'spring', ...spec })

      expect(await first.finished).toBe('replaced')

      const reference = spring({
        keyframes: [origin, 0],
        ...spec,
        duration: 'duration' in spec ? spec.duration! * 1000 : undefined,
        velocity,
      })

      time.advance(20)
      expect(value.get()).toBeCloseTo(reference.next(20).value, 8)
      second.stop()
      expect(await second.finished).toBe('cancelled')
      expect(time.count()).toBe(0)
    }
  })

  it.each(['loop', 'reverse', 'mirror'] as const)(
    'times repeated %s spring legs, delay and cancellation',
    async (repeatType) => {
      const run = playback({
        duration: 0.1,
        bounce: 0.4,
        delay: 0.05,
        repeat: 1,
        repeatDelay: 0.02,
        repeatType,
      })

      run.time.advance(49)
      expect(run.value()).toBe(0)
      run.time.advance(101)
      expect(run.value()).toBe(100)
      run.time.advance(19)
      expect(run.value()).toBe(100)
      run.time.advance(101)
      expect(run.value()).toBe(repeatType === 'loop' ? 100 : 0)
      expect(await run.controls.finished).toBe('finished')
      expect(run.completions()).toBe(1)

      const cancelled = playback({ duration: 2, bounce: 0.9, repeat: Infinity })

      cancelled.time.advance(40)

      const frozen = cancelled.value()

      cancelled.controls.stop()
      cancelled.time.advance(10000)
      expect(cancelled.value()).toBe(frozen)
      expect(await cancelled.controls.finished).toBe('cancelled')
      expect(cancelled.completions()).toBe(0)
      expect(cancelled.time.count()).toBe(0)
    },
  )

  it('settles reduced transforms immediately while opacity keeps duration timing', async () => {
    const time = fakeClock()
    const controller = new Controller(time.clock)
    const finished = controller.animate(
      { x: 100, opacity: 0 },
      { type: 'spring', duration: 0.4, bounce: 0.3 },
      true,
    )

    expect(controller.snapshot()).toEqual({ x: 100, opacity: 1 })
    time.advance(399)
    expect(time.count()).toBe(1)
    time.advance(1)
    expect(await finished).toBe('finished')
    expect(controller.snapshot()).toEqual({ x: 100, opacity: 0 })
    expect(time.count()).toBe(0)
    controller.destroy()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { delegatedRun } from './driver.ts'
import { Controller } from './controller'
import type { Target } from './types'

// The real driver, with Android's pixel-valued bridge and NativeScript's DIP cache.
function androidHost() {
  let listener: any
  const pixels = { x: 0, y: 0 }
  const cache = { x: 0, y: 0 }
  const targets: Target = {}
  const animator = {
    setInterpolator() {},
    setDuration: vi.fn(),
    setStartDelay: vi.fn(),
    translationX(x: number) {
      targets.x = x
    },
    translationY(y: number) {
      targets.y = y
    },
    scaleX: vi.fn(),
    scaleY: vi.fn(),
    rotation: vi.fn(),
    alpha: vi.fn(),
    setListener(value: any) {
      listener = value
    },
    start() {},
    cancel() {
      listener.onAnimationCancel()
      listener.onAnimationEnd()
    },
  }

  vi.stubGlobal('android', {
    animation: {
      Animator: {
        AnimatorListener: class {
          constructor(value: object) {
            return value
          }
        },
      },
    },
  })

  vi.stubGlobal('androidx', {
    core: {
      view: {
        animation: {
          PathInterpolatorCompat: {
            create() {
              return {}
            },
          },
        },
      },
    },
  })

  const view = {
    animate: () => animator,
    getResources: () => ({ getDisplayMetrics: () => ({ density: 3 }) }),
    getTranslationX: () => pixels.x,
    getTranslationY: () => pixels.y,
    getAlpha: () => 1,
    getScaleX: () => 1,
    getScaleY: () => 1,
    getRotation: () => 0,
  }

  const write = vi.fn((value: Target) => {
    for (const key of ['x', 'y'] as const) {
      if (value[key] !== undefined && cache[key] !== value[key]) {
        cache[key] = value[key]
        pixels[key] = value[key] * 3
      }
    }
  })

  const node = { nativeViewProtected: view }

  return { node, write, cache, pixels, targets, animator, end: () => listener.onAnimationEnd() }
}

afterEach(() => vi.unstubAllGlobals())

describe('Android delegated translation boundary (#206)', () => {
  it('converts DIP targets to pixels and samples back to DIP, leaving other units alone', () => {
    const host = androidHost()
    const run = delegatedRun(
      host.node,
      {
        target: { x: 100, y: -20, scaleX: 2, rotate: 90, opacity: 0.5 },
        dest: { x: 100, y: -20 },
        eff: { x: 100, y: -20, scaleX: 2, rotate: 90, opacity: 0.5 },
        transition: { duration: 1, delay: 0.2 },
      },
      host.write,
    )!

    expect(host.targets).toEqual({ x: 300, y: -60 })
    host.pixels.x = 90
    host.pixels.y = -30
    expect(run.sample()).toMatchObject({ x: 30, y: -10 })
    expect(host.animator.scaleX).toHaveBeenCalledWith(2)
    expect(host.animator.rotation).toHaveBeenCalledWith(90)
    expect(host.animator.alpha).toHaveBeenCalledWith(0.5)
    expect(host.animator.setDuration).toHaveBeenCalledWith(1000)
    expect(host.animator.setStartDelay).toHaveBeenCalledWith(200)
    run.cancel()
  })

  it('completes without moving the physical endpoint and ignores cancellation after completion', async () => {
    const host = androidHost()
    const run = delegatedRun(
      host.node,
      {
        target: { x: 100 },
        dest: { x: 100 },
        eff: { x: 100 },
        transition: {},
      },
      host.write,
    )!

    host.pixels.x = host.targets.x!
    host.end()
    expect(await run.finished).toBe('finished')
    expect(host.cache.x).toBe(100)
    expect(host.pixels.x).toBe(300)
    run.cancel()
    expect(host.write).toHaveBeenCalledTimes(1)
  })

  it.each([0, 90])(
    'freezes cancellation at %s pixels and restores the cache before the next equal write',
    async (position) => {
      const host = androidHost()
      const run = delegatedRun(
        host.node,
        {
          target: { x: 100 },
          dest: { x: 100 },
          eff: { x: 100 },
          transition: { delay: 1 },
        },
        host.write,
      )!

      host.pixels.x = position
      run.cancel()
      expect(await run.finished).toBe('cancelled')
      expect(host.cache.x).toBe(position / 3)
      expect(host.pixels.x).toBe(position)
      host.write({ x: 0 })
      expect(host.pixels.x).toBe(0)
      run.cancel()
      expect(await run.finished).toBe('cancelled')
    },
  )

  it.each(['stop', 'replacement', 'spring'] as const)(
    'preserves public position and velocity on %s',
    async (action) => {
      const host = androidHost()
      let now = 0,
        id = 0

      const frames = new Map<number, () => void>()
      const clock = {
        now: () => now,
        request(fn: () => void) {
          frames.set(++id, fn)
          return id
        },
        cancel(key: number) {
          frames.delete(key)
        },
      }

      const step = (ms: number) => {
        now += ms

        const pending = [...frames.values()]

        frames.clear()
        pending.forEach((fn) => fn())
      }

      const controller = new Controller(clock)

      controller.seed({ x: 0 })
      controller.attach({
        read: () => ({ x: 0 }),
        write: host.write,
        restore() {},
        delegate: (req) => delegatedRun(host.node, req, host.write),
      })

      const first = controller.animate({ x: 100 }, { duration: 1 }, false)

      host.pixels.x = 81
      step(10)
      host.pixels.x = 90
      step(10)
      expect(controller.value('x').get()).toBe(30)
      expect(controller.value('x').getVelocity()).toBeCloseTo(300)
      if (action === 'stop') {
        controller.stop()
      } else {
        const second = controller.animate(
          { x: 200 },
          action === 'spring' ? { type: 'spring' } : { duration: 1 },
          false,
        )

        expect(host.pixels.x).toBe(90)
        expect(controller.value('x').get()).toBe(30)
        expect(controller.value('x').getVelocity()).toBeCloseTo(300)
        if (action === 'spring') {
          step(16)
          expect(controller.value('x').get()).toBeGreaterThan(30)
          expect(host.pixels.x).toBeCloseTo(controller.value('x').get() * 3)
        } else {
          expect(host.targets.x).toBe(600)
        }

        controller.stop()
        await second
      }

      expect(await first).toBe('replaced')
      expect(host.cache.x).toBeCloseTo(controller.value('x').get())
      expect(frames.size).toBe(0)
    },
  )
})

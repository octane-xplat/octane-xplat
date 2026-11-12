import { expect, it } from 'vitest'
import { Controller } from './controller'
import { createStyleLease } from './style-lease'
import type { Clock } from './clock-types'
import type { HostAdapter } from './host-types'
import type { ResolvedTarget, StyleProperty } from './types'
import type { MotionData, ValueReferences } from './value-codec'

function fixture() {
  let now = 0,
    id = 0,
    delegated = 0
  let resized = () => {}
  const pending = new Map<number, () => void>()
  const refs: ValueReferences = { width: 200, height: 100, parentWidth: 400, parentHeight: 300 }
  const styles: Partial<Record<StyleProperty, MotionData>> = {
    width: '100px',
    borderRadius: '0px',
    clipPath: 'inset(0% round 0px)',
  }
  let display: ResolvedTarget = {}
  const clock: Clock = {
    now: () => now,
    request(callback) {
      pending.set(++id, callback)
      return id
    },
    cancel(key) {
      pending.delete(key)
    },
  }
  const lease = createStyleLease(
    (key) => styles[key],
    (key, value) => {
      styles[key] = value
    },
  )
  const adapter: HostAdapter = {
    read: () => ({}),
    write: (values) => {
      display = values
    },
    restore() {},
    delegate() {
      delegated++
      return null
    },
    styles: {
      ...lease,
      platform: 'test',
      read: (key) => styles[key],
      references: () => refs,
      observe(callback) {
        resized = callback
        return () => {
          resized = () => {}
        }
      },
    },
  }
  const controller = new Controller(clock)
  controller.attach(adapter)
  return {
    controller,
    styles,
    refs,
    pending,
    display: () => display,
    delegated: () => delegated,
    resize: () => resized(),
    step(ms: number) {
      now += ms
      const batch = [...pending]
      for (const [key, callback] of batch) {
        if (pending.delete(key)) {
          callback()
        }
      }
    },
  }
}

it('animates resolved numeric styles and clipping on the shared JS clock', async () => {
  const f = fixture()
  f.controller.seed({ x: '0px', width: '100px', clipPath: 'inset(20% 10% round 12px)' })
  const run = f.controller.animate(
    { x: '50%', width: '50%', clipPath: 'inset(0% round 0px)' },
    { duration: 1, ease: 'linear' },
    false,
  )
  f.step(500)
  expect(f.controller.snapshot().x).toBe(50)
  expect(f.styles.width).toBe('150px')
  expect(f.styles.clipPath).toContain('inset(10px 10px 10px 10px')
  expect(f.delegated()).toBe(0)
  f.step(500)
  expect(await run).toBe('finished')
  expect(f.pending.size).toBe(0)
})

it('rebases a relative destination at the displayed sample without settling its logical promise', async () => {
  const f = fixture()
  const results: string[] = []
  const run = f.controller.animate({ x: '50%' }, { duration: 1, ease: 'linear' }, false)
  void run.then((result) => results.push(result))
  f.step(500)
  expect(f.controller.snapshot().x).toBe(50)
  f.refs.width = 400
  f.resize()
  expect(f.controller.snapshot().x).toBe(50)
  await Promise.resolve()
  expect(results).toEqual([])
  f.step(500)
  expect(await run).toBe('finished')
  expect(f.controller.snapshot().x).toBe(200)
})

it('prevalidates every property and path before replacing active playback', async () => {
  const f = fixture()
  f.controller.seed({ clipPath: 'path("M0 0 L100 100 L0 100 Z")' })
  const run = f.controller.animate({ x: 100 }, { duration: 1 }, false)
  await expect(
    f.controller.animate(
      { x: 200, clipPath: 'path("M0 0 Q50 50 100 100 Z")' },
      { duration: 1 },
      false,
    ),
  ).rejects.toThrow(/incompatible/)
  f.step(1000)
  expect(await run).toBe('finished')
  expect(f.controller.snapshot().x).toBe(100)
})

it('restores only owned styles and releases resize and frame work', async () => {
  const f = fixture()
  f.controller.seed({ width: 80, clipPath: 'inset(10% round 12px)' })
  const run = f.controller.animate({ width: 200 }, { duration: 1 }, false)
  f.step(100)
  f.styles.clipPath = 'circle(40px)'
  f.controller.destroy()
  expect(await run).toBe('replaced')
  expect(f.styles.width).toBe('100px')
  expect(f.styles.clipPath).toBe('circle(40px)')
  expect(f.pending.size).toBe(0)
  f.resize()
})

it('resolves an unmeasured seed after layout and cancels a pending first-frame start on disposal', async () => {
  const f = fixture()
  f.refs.measured = false
  f.controller.seed({ clipPath: 'inset(10%)', x: '50%' })
  expect(f.styles.clipPath).toBe('inset(10%)')
  const first = f.controller.animate({ x: '100%' }, { duration: 1 }, false)
  f.refs.measured = true
  f.resize()
  expect(f.controller.snapshot().x).toBe(100)
  f.step(16)
  await Promise.resolve()
  f.step(1000)
  expect(await first).toBe('finished')
  const g = fixture()
  g.refs.measured = false
  const pending = g.controller.animate({ x: '50%' }, {}, false)
  g.controller.destroy()
  expect(await pending).toBe('cancelled')
  expect(g.pending.size).toBe(0)
})

it('cannot revive a removed pending binding or an obsolete unmeasured start', async () => {
  const f = fixture()
  f.refs.measured = false
  f.controller.set('clipPath', 'inset(10%)')
  f.controller.set('clipPath', undefined)
  const old = f.controller.animate({ x: '50%' }, { duration: 1 }, false)
  f.refs.measured = true
  f.resize()
  const next = f.controller.animate({ x: 20 }, { duration: 0 }, false)
  expect(await old).toBe('replaced')
  expect(await next).toBe('finished')
  f.step(16)
  expect(f.controller.snapshot().x).toBe(20)
  expect(f.styles.clipPath).toBe('inset(0% round 0px)')
  expect(f.pending.size).toBe(0)
})

it('clamps negative spring overshoot for nonnegative style lengths at serialization', async () => {
  const f = fixture()
  const run = f.controller.animate(
    { width: 0 },
    { type: 'spring', duration: 0.5, bounce: 0.8 },
    false,
  )
  for (let i = 0; i < 100; i++) {
    f.step(10)
    expect(Number.parseFloat(String(f.styles.width))).toBeGreaterThanOrEqual(0)
  }
  expect(await run).toBe('finished')
  expect(f.styles.width).toBe('0px')
})

it('keeps unrelated relative playback and resize ownership during gesture-channel updates', async () => {
  const f = fixture()
  const moving = f.controller.animate({ x: '50%' }, { duration: 1, ease: 'linear' }, false)
  f.step(500)
  const feedback = f.controller.animate({ opacity: 0.5 }, { duration: 1 }, false, true)
  f.refs.width = 400
  f.resize()
  f.step(500)
  expect(await moving).toBe('finished')
  expect(f.controller.snapshot().x).toBe(200)
  f.step(500)
  expect(await feedback).toBe('finished')
})

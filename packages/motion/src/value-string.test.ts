import { expect, it } from 'vitest'
import { MotionValue } from './value'
import type { Clock } from './clock-types'

function fixture() {
  let now = 0,
    id = 0
  const pending = new Map<number, () => void>()
  const clock: Clock = {
    now: () => now,
    request: (callback) => {
      pending.set(++id, callback)
      return id
    },
    cancel: (key) => {
      pending.delete(key)
    },
  }
  return {
    clock,
    pending,
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

it('batches every compound slot into one displayed sample, then reverses without jumping', async () => {
  const f = fixture()
  const value = new MotionValue<string>('inset(20% 10% round 12px)', f.clock)
  const samples: string[] = []
  value.on('change', (sample) => samples.push(sample))
  const first = value.animate('inset(0% 0% round 0px)', { duration: 1, ease: 'linear' })
  f.step(500)
  expect(samples).toHaveLength(1)
  expect(value.get()).toBe('inset(10% 5% 10% 5% round 6px 6px 6px 6px / 6px 6px 6px 6px)')
  const displayed = value.get()
  const reverse = value.animate('inset(20% 10% round 12px)', { duration: 0.5, ease: 'linear' })
  expect(value.get()).toBe(displayed)
  expect(await first.finished).toBe('replaced')
  f.step(500)
  expect(await reverse.finished).toBe('finished')
  expect(f.pending.size).toBe(0)
  expect(value.getVelocity()).toBe(0)
})

it('validates incompatible paths before interrupting active playback', async () => {
  const f = fixture()
  const value = new MotionValue<string>('path("M0 0 L100 0 L100 100 Z")', f.clock)
  const run = value.animate('path("M10 0 L90 0 L90 90 Z")', { duration: 1 })
  expect(() => value.animate('path("M0 0 Q10 10 20 20 Z")')).toThrow(/incompatible/)
  f.step(1000)
  expect(await run.finished).toBe('finished')
})

it('freezes and disposes all compound slot frames and reports unit-string velocity', async () => {
  const f = fixture()
  const value = new MotionValue<string>('0px', f.clock)
  value.set('10px')
  f.step(10)
  value.set('20px')
  expect(value.getVelocity()).toBe(1000)
  const run = value.animate('100px', { duration: 1 })
  f.step(20)
  const displayed = value.get()
  value.destroy()
  expect(await run.finished).toBe('cancelled')
  f.step(100)
  expect(value.get()).toBe(displayed)
  expect(f.pending.size).toBe(0)
})

it('allows an explicit zero-duration snap to an incompatible clip and clamps overshooting corners', async () => {
  const f = fixture()
  const value = new MotionValue<string>('inset(0% round 20px)', f.clock)
  const spring = value.animate('inset(0% round 0px)', {
    type: 'spring',
    stiffness: 220,
    damping: 8,
  })
  for (let i = 0; i < 400; i++) {
    f.step(10)
  }
  expect(await spring.finished).toBe('finished')
  expect(value.get()).not.toContain('-')
  expect(await value.animate('none', { duration: 0 }).finished).toBe('finished')
  expect(value.get()).toBe('none')
  expect(f.pending.size).toBe(0)
})

it('allows derived relative samples before first layout and resolves mixed units after measurement', async () => {
  const f = fixture()
  const refs = { measured: false, width: 0, height: 0 }
  const clip = new MotionValue<string>('inset(20%)', f.clock)
  clip.markDerived()
  clip.bindResolution({}, 'clipPath', () => refs)
  expect(() => clip.updateDerived('inset(10%)')).not.toThrow()
  const x = new MotionValue<string>('0px', f.clock)
  x.bindResolution({}, 'x', () => refs)
  expect(() => x.animate('50%')).toThrow(/measured/)
  refs.measured = true
  refs.width = 240
  refs.height = 160
  expect(await x.animate('50%', { duration: 0 }).finished).toBe('finished')
  expect(x.get()).toBe('120px')
  x.bindResolution({}, 'x', () => ({ ...refs, width: 400 }))
  expect(() => x.animate('50%')).toThrow(/resolves differently/)
  clip.destroy()
  x.destroy()
})

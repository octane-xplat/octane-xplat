import { expect, it, vi } from 'vitest'
import { Controller } from './controller'
import { attachHost } from './host'
import type { Clock } from './clock-types'
import type { Target } from './types'

it('preserves combined scale across native property writes and delegated handoffs (#207)', async () => {
  let now = 0,
    id = 0
  const frames = new Map<number, () => void>()
  const clock: Clock = {
    now: () => now,
    request(fn) {
      frames.set(++id, fn)
      return id
    },
    cancel(key) {
      frames.delete(key)
    },
  }
  const advance = (ms: number) => {
    now += ms
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((fn) => fn())
  }
  const node = { scaleX: 1, scaleY: 1, opacity: 1 }
  const host = attachHost(node)
  let sample: Target = { scaleX: 2.25, scaleY: 1.5 }
  let finish!: (result: 'cancelled') => void
  // Real NativeScript host writes; presentation bridge double, not a device.
  host.delegate = vi.fn(() => ({
    sample: () => sample,
    finished: new Promise<'cancelled'>((resolve) => {
      finish = resolve
    }),
    cancel() {
      finish('cancelled')
    },
  }))
  const controller = new Controller(clock)
  controller.attach(host)
  controller.seed({ scale: 1, scaleX: 1, scaleY: 1 })
  const first = controller.animate({ scale: 2, scaleX: 2 }, { duration: 1, ease: 'linear' }, false)
  advance(500)
  expect(host.delegate).not.toHaveBeenCalled()
  expect(node).toMatchObject({ scaleX: 2.25, scaleY: 1.5 })
  const second = controller.animate({ scaleX: 3, scaleY: 2 }, { duration: 1 }, false)
  expect(await first).toBe('replaced')
  expect(host.delegate).toHaveBeenCalledOnce()
  sample = { scaleX: 3, scaleY: 2.25 }
  advance(16)
  const third = controller.animate(
    { scale: -1, scaleX: 0, scaleY: -2 },
    { duration: 1, ease: 'linear' },
    false,
  )
  expect(await second).toBe('replaced')
  controller.flush()
  expect(node).toMatchObject({ scaleX: 3, scaleY: 2.25 })
  advance(500)
  controller.stop()
  await third
  const pose = { scaleX: node.scaleX, scaleY: node.scaleY }
  controller.set('opacity', 0.5)
  expect(node).toMatchObject(pose)
  expect(Object.values(node).every(Number.isFinite)).toBe(true)
  expect(frames.size).toBe(0)
})

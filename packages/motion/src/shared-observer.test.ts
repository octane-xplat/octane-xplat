import { expect, it, vi } from 'vitest'
import { createSharedObserver } from './shared-observer'

it('shares one subscription, keeps duplicate callbacks independent and releases it once', () => {
  const stop = vi.fn()
  let dispatch = () => {}
  const start = vi.fn((notify: () => void) => {
    dispatch = notify
    return stop
  })

  const observe = createSharedObserver(start)
  const notify = vi.fn()
  const a = observe(notify),
    b = observe(notify)

  expect(start).toHaveBeenCalledOnce()
  dispatch()
  expect(notify).toHaveBeenCalledTimes(2)
  a()
  a()
  expect(stop).not.toHaveBeenCalled()
  b()
  b()
  expect(stop).toHaveBeenCalledOnce()
  dispatch()
  expect(notify).toHaveBeenCalledTimes(2)

  const c = observe(notify)

  expect(start).toHaveBeenCalledTimes(2)
  c()
})

it('ignores queued old notifications and safely handles subscription changes inside callbacks', () => {
  const callbacks: (() => void)[] = []
  const observe = createSharedObserver((notify) => {
    callbacks.push(notify)
    return () => {}
  })

  const later = vi.fn(),
    removed = vi.fn()

  let stopLater = () => {}
  const stopFirst = observe(() => {
    stopSecond()
    stopLater = observe(later)
  })

  const stopSecond = observe(removed)

  callbacks[0]()
  expect(removed).not.toHaveBeenCalled()
  expect(later).not.toHaveBeenCalled()
  stopFirst()
  stopLater()

  const current = vi.fn()
  const off = observe(current)

  callbacks[0]()
  expect(current).not.toHaveBeenCalled()
  callbacks[1]()
  expect(current).toHaveBeenCalledOnce()
  off()
})

it('can retry failed acquisition and isolates failures between existing readers', () => {
  let dispatch = () => {}
  let failing = true
  const observe = createSharedObserver((notify) => {
    if (failing) {
      throw new Error('start')
    }

    dispatch = notify
    return () => {}
  })

  expect(() => observe(() => {})).toThrow('start')
  failing = false

  const a = observe(() => {
    throw new Error('reader')
  })

  const second = vi.fn()
  const b = observe(second)

  expect(() => dispatch()).toThrow('reader')
  expect(second).toHaveBeenCalledOnce()
  a()
  b()
})

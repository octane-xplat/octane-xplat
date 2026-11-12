import { afterEach, expect, it, vi } from 'vitest'

const core = vi.hoisted(() => ({
  Application: { resumeEvent: 'resume', on: vi.fn(), off: vi.fn() },
  Device: { sdkVersion: '35' },
  Utils: { android: { getApplicationContext: () => ({ getContentResolver: () => ({}) }) } },
}))

vi.mock('@nativescript/core', () => core)

import { observeReducedMotion } from './reduced-motion.ts'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('uses one Android timer/resume listener for every subscriber and removes both when idle', () => {
  vi.useFakeTimers()

  let scale = 1

  vi.stubGlobal('android', {
    animation: { ValueAnimator: { areAnimatorsEnabled: () => true } },
    provider: { Settings: { Global: { getFloat: () => scale } } },
  })

  const first = vi.fn(),
    second = vi.fn()

  const a = observeReducedMotion(first),
    b = observeReducedMotion(second)

  expect(vi.getTimerCount()).toBe(1)
  expect(core.Application.on).toHaveBeenCalledOnce()
  scale = 0
  vi.advanceTimersByTime(500)
  expect(first).toHaveBeenCalledOnce()
  expect(second).toHaveBeenCalledOnce()
  a()
  a()
  expect(vi.getTimerCount()).toBe(1)
  scale = 1

  const resume = core.Application.on.mock.calls[0][1]

  resume()
  expect(first).toHaveBeenCalledOnce()
  expect(second).toHaveBeenCalledTimes(2)
  b()
  b()
  expect(vi.getTimerCount()).toBe(0)
  expect(core.Application.off).toHaveBeenCalledExactlyOnceWith('resume', resume)
  scale = 0
  resume()
  expect(second).toHaveBeenCalledTimes(2)
})

it('shares one iOS notification token and removes it from its original application', () => {
  let dispatch = () => {}
  const token = {}
  const application = {
    addNotificationObserver: vi.fn((_name, callback) => {
      dispatch = callback
      return token
    }),
    removeNotificationObserver: vi.fn(),
  }

  Reflect.set(core.Application, 'ios', application)
  vi.stubGlobal('UIAccessibilityReduceMotionStatusDidChangeNotification', 'reduce-motion')

  const first = vi.fn(),
    second = vi.fn()

  const a = observeReducedMotion(first),
    b = observeReducedMotion(second)

  expect(application.addNotificationObserver).toHaveBeenCalledOnce()
  a()
  dispatch()
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledOnce()
  Reflect.deleteProperty(core.Application, 'ios')
  b()
  b()
  dispatch()
  expect(second).toHaveBeenCalledOnce()
  expect(application.removeNotificationObserver).toHaveBeenCalledExactlyOnceWith(
    token,
    'reduce-motion',
  )
})

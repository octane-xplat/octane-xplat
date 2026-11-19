import { afterEach, expect, it, vi } from 'vitest'
import { createAppLifecycle, type AppLifecycleHost } from '../../src/app/lifecycle.js'
import { createWindowsSingleInstance } from '../../src/app/second-instance.windows.js'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function makeApp(isReady: () => boolean) {
  const host: AppLifecycleHost = {
    ...createWindowsSingleInstance(isReady),
    isReady,
    whenReady: async () => {},
    quit() {},
    addQuitGuard: () => () => {},
  }
  return createAppLifecycle(() => host)
}

it('delivers a queued launch after readiness, and leaves the rest queued if the listener unsubscribes', async () => {
  vi.useFakeTimers()
  let ready = false
  const messages = ['["first"]', '["second"]']
  const invoke = vi.fn((_assembly, _type, method: string) => {
    if (method === 'IsSupported') return 'yes'
    if (method === 'Acquire') return 'primary'
    return messages.shift() ?? 'null'
  })
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })

  const app = makeApp(() => ready)
  expect(app.supportsSingleInstanceLock).toBe(true)
  expect(app.supportsSecondInstance).toBe(false)
  expect(app.requestSingleInstanceLock()).toBe(true)
  expect(app.supportsSecondInstance).toBe(true)
  const listener = vi.fn(() => app.off('second-instance', listener))
  app.on('second-instance', listener)
  await vi.advanceTimersByTimeAsync(200)
  expect(messages).toHaveLength(2)

  ready = true
  await vi.advanceTimersByTimeAsync(200)
  expect(listener).toHaveBeenCalledExactlyOnceWith({ type: 'second-instance' }, ['first'], undefined)
  expect(messages).toEqual(['["second"]'])
})

it('returns false for a redirected process without enabling its event listener', () => {
  const invoke = vi.fn((_assembly, _type, method: string) => method === 'IsSupported' ? 'yes' : 'redirected')
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })
  const app = makeApp(() => false)

  expect(app.requestSingleInstanceLock()).toBe(false)
  expect(app.supportsSecondInstance).toBe(false)
  expect(() => app.on('second-instance', () => {})).toThrow('app.second-instance')
})

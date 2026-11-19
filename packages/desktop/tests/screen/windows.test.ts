import { afterEach, expect, it, vi } from 'vitest'
import { screen } from '../../src/screen/index.windows.js'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('uses Windows snapshots only while there is a listener', async () => {
  vi.useFakeTimers()
  const rect = { x: 0, y: 0, width: 1600, height: 900 }
  let scaleFactor = 1
  const invoke = vi.fn((_assembly, _type, method: string) => method === 'IsSupported' ? 'yes' :
    JSON.stringify([{ id: 'main', bounds: rect, workArea: rect, scaleFactor, isPrimary: true }]))
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })
  const changed = vi.fn()

  screen.on('display-metrics-changed', changed)
  try {
    scaleFactor = 1.5
    await vi.advanceTimersByTimeAsync(1000)
    expect(changed).toHaveBeenCalledExactlyOnceWith(
      { type: 'display-metrics-changed' },
      { id: 'main', bounds: rect, workArea: rect, scaleFactor: 1.5, isPrimary: true },
      ['scaleFactor'],
    )
  } finally {
    screen.off('display-metrics-changed', changed)
  }
  invoke.mockClear()
  await vi.advanceTimersByTimeAsync(2000)
  expect(invoke).not.toHaveBeenCalled()
})

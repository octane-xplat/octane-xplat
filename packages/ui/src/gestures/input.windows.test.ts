import { expect, it, vi } from 'vitest'
import { createPanController } from './controller'
import {
  attachWindowsGesture,
  attachWindowsPress,
  dispatchWindowsActivation,
  createWindowsActionControl,
  windowsActivationSource,
  observeWindowsActionControl,
} from './input.windows'
import type { ActivationEvent } from './types'
import type { HostPressBinding } from './input.host'

it('feeds one root owner and keeps non-pointer actions independent of a claimed pointer', () => {
  const ids = new WeakMap<object, number>()
  const delegates = new Map<object, (frame: string) => void>()
  const observers = new Map<number, (frame: string) => void>()
  let nextId = 1,
    nextObserver = 0
  vi.stubGlobal('NSWinRT', {
    dotnet: {
      asDelegate(_type: string, callback: (frame: string) => void) {
        const delegate = {}
        delegates.set(delegate, callback)
        return delegate
      },
      invoke(_assembly: string, _type: string, method: string, args: readonly unknown[]) {
        if (method === 'Schedule') {
          return 1000
        }
        if (method === 'CancelTimer') {
          return
        }
        const native = args[0]
        if (method === 'Release') {
          observers.delete(Number(native))
          return
        }
        if (typeof native !== 'object' || native === null) {
          throw new Error('Expected native host')
        }
        if (method === 'Describe') {
          let id = ids.get(native)
          if (!id) {
            id = ++nextId
            ids.set(native, id)
          }
          return JSON.stringify({ host: id, root: 1 })
        }
        if (method === 'Local') {
          return JSON.stringify({ x: args[1], y: args[2], width: 500, height: 500 })
        }
        if (method === 'Claim') {
          return true
        }
        if (method === 'Observe') {
          const key = args[1]
          if (typeof key !== 'object' || key === null) {
            throw new Error('Expected delegate')
          }
          const callback = delegates.get(key)
          if (!callback) {
            throw new Error('Unknown delegate')
          }
          const id = ++nextObserver
          observers.set(id, callback)
          return id
        }
        throw new Error('Unexpected method: ' + method)
      },
    },
  })
  const parent = { nativeViewProtected: {}, isLoaded: true }
  const child = { nativeViewProtected: {}, isLoaded: true, parent }
  const calls: string[] = []
  const pan = createPanController({
    axis: 'x',
    onStart() {
      calls.push('start')
    },
  })
  const press = (event: ActivationEvent) => {
    calls.push(event.source)
    if (event.source !== 'pointer') {
      expect(event.pointer).toBeNull()
    }
  }
  let off: (() => void) | undefined
  let binding: HostPressBinding | undefined
  try {
    off = attachWindowsGesture(parent, pan.handle)
    binding = attachWindowsPress(child, { slop: 8, onPress: press })
    expect(observers.size).toBe(1)
    let serial = 0
    const send = (type: 'down' | 'move' | 'up', x: number) => {
      const changed = { id: '1', kind: 'mouse', window: { x, y: 0 }, screen: null }
      const frame = JSON.stringify({
        identity: String(++serial),
        cohort: '1',
        type,
        time: serial * 10,
        changed,
        contacts: type === 'up' ? [] : [changed],
        path: [ids.get(child.nativeViewProtected), ids.get(parent.nativeViewProtected)],
        nativeOwned: false,
        cancelReason: null,
      })
      for (const callback of [...observers.values()]) {
        callback(frame)
      }
    }
    send('down', 0)
    send('move', 20)
    dispatchWindowsActivation(child, 'virtual')
    dispatchWindowsActivation(child, 'keyboard')
    send('up', 20)
    dispatchWindowsActivation(child, 'pointer')
    expect(calls).toEqual(['start', 'virtual', 'keyboard'])
    send('down', 0)
    send('up', 0)
    dispatchWindowsActivation(child, 'pointer')
    expect(calls).toEqual(['start', 'virtual', 'keyboard', 'pointer'])
  } finally {
    binding?.dispose()
    off?.()
    pan.dispose()
    vi.unstubAllGlobals()
  }
  expect(observers.size).toBe(0)
})

it('marks native pointer and key dispatch only for the synchronous activation call', () => {
  const sources: ActivationEvent['source'][] = []
  class Button {
    OnPointerReleased() {
      sources.push(windowsActivationSource(this))
    }
    OnKeyDown() {
      sources.push(windowsActivationSource(this))
    }
    OnKeyUp() {
      sources.push(windowsActivationSource(this))
      throw new Error('native key fault')
    }
  }
  vi.stubGlobal('Microsoft', { UI: { Xaml: { Controls: { Button, HyperlinkButton: Button } } } })
  try {
    const peer = createWindowsActionControl('Button')
    peer.OnPointerReleased({})
    peer.OnKeyDown({})
    expect(() => peer.OnKeyUp({})).toThrow('native key fault')
    expect(sources).toEqual(['pointer', 'keyboard', 'keyboard'])
    expect(windowsActivationSource(peer)).toBe('virtual')
  } finally {
    vi.unstubAllGlobals()
  }
})

it('releases typed semantic subscriptions once and rejects retained managed callbacks', () => {
  let callback: ((event: string) => void) | undefined
  const released: unknown[] = []
  vi.stubGlobal('NSWinRT', {
    dotnet: {
      asDelegate(_type: string, handler: (event: string) => void) {
        callback = handler
        return {}
      },
      invoke(_assembly: string, _type: string, method: string, args: readonly unknown[]) {
        if (method === 'ObserveAction') {
          return 42
        }
        if (method === 'ReleaseAction') {
          released.push(args[0])
          return
        }
        throw new Error('Unexpected method: ' + method)
      },
    },
  })
  const calls: string[] = []
  try {
    const dispose = observeWindowsActionControl(
      {},
      () => calls.push('click'),
      () => calls.push('layout'),
    )
    callback?.('click')
    callback?.('layout')
    dispose()
    callback?.('click')
    callback?.('layout')
    dispose()
    expect(calls).toEqual(['click', 'layout'])
    expect(released).toEqual([42])
  } finally {
    vi.unstubAllGlobals()
  }
})

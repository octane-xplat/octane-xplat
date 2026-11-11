import { expect, it } from 'vitest'
import { bindLoadedNativeHost } from './native-host-lifecycle'
import type { NativeGestureView } from './input.native'

function fixture() {
  const listeners = new Map<string, Set<(event: unknown) => void>>()
  const native: { XamlRoot: object | null } = { XamlRoot: null }
  const host: NativeGestureView = {
    nativeViewProtected: native,
    isLoaded: true,
    style: {},
    on(name, listener) {
      let set = listeners.get(name)

      if (!set) {
        listeners.set(name, (set = new Set()))
      }

      set.add(listener)
    },
    off(name, listener) {
      listeners.get(name)?.delete(listener)
    },
  }

  return {
    host,
    native,
    listeners,
    emit(name: string) {
      for (const listener of listeners.get(name) ?? []) {
        listener({})
      }
    },
  }
}

it('attaches once after the loaded WinUI host enters a XamlRoot, and reattaches after unload', async () => {
  const f = fixture()
  let attached = 0,
    retired = 0

  const release = bindLoadedNativeHost(f.host, () => {
    attached++
    return () => {
      retired++
    }
  })

  f.emit('loaded')
  await Promise.resolve()
  expect(attached).toBe(0)
  f.native.XamlRoot = {}
  f.emit('layoutChanged')
  f.emit('loaded')
  await Promise.resolve()
  expect(attached).toBe(1)
  f.emit('unloaded')
  expect(retired).toBe(1)
  f.emit('loaded')
  await Promise.resolve()
  expect(attached).toBe(2)
  release()
  release()
  expect(retired).toBe(2)
  expect([...f.listeners.values()].every((set) => set.size === 0)).toBe(true)
})

it('retirement invalidates pending loaded and layout callbacks', async () => {
  const f = fixture()
  let attached = false
  const release = bindLoadedNativeHost(f.host, () => {
    attached = true
    return () => {}
  })

  f.native.XamlRoot = {}
  f.emit('loaded')
  release()
  await Promise.resolve()
  expect(attached).toBe(false)
  expect([...f.listeners.values()].every((set) => set.size === 0)).toBe(true)
})

it('accepts a NativeScript ref before its native view property is initialized', async () => {
  const f = fixture()

  Reflect.deleteProperty(f.host, 'nativeViewProtected')

  let attached = false
  const release = bindLoadedNativeHost(f.host, () => {
    attached = true
    return () => {}
  })

  expect(attached).toBe(false)
  f.native.XamlRoot = {}
  Reflect.set(f.host, 'nativeViewProtected', f.native)
  f.emit('loaded')
  await Promise.resolve()
  expect(attached).toBe(true)
  release()
})

it('removes host subscriptions when immediate attachment fails', () => {
  const f = fixture()

  f.native.XamlRoot = {}

  const failure = new Error('input unavailable')

  expect(() =>
    bindLoadedNativeHost(f.host, () => {
      throw failure
    }),
  ).toThrow(failure)

  expect([...f.listeners.values()].every((set) => set.size === 0)).toBe(true)
})

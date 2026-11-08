import { describe, expect, it, vi } from 'vitest'

import type { BindOutcome, BindRequest, HotkeyBackend } from '../src/backend'
import { createRegistry } from '../src/registry'

interface FakeBackend extends HotkeyBackend {
  requests: BindRequest[]
  presses: Map<number, () => void>
  released: number[]
  fire(key: number): void
  exit(): void
  bindResults?: Record<string, BindOutcome>
}

function fakeBackend(overrides: Partial<FakeBackend> = {}): FakeBackend {
  let exitListener: (() => void) | null = null
  const backend: FakeBackend = {
    platform: 'windows',
    requests: [],
    presses: new Map(),
    released: [],
    support: () =>
      Promise.resolve({
        supported: true,
        platform: 'windows',
        mechanism: 'win32',
        assignment: 'exact',
      }),
    bind(request, onPress) {
      backend.requests.push(request)
      backend.presses.set(request.key, onPress)

      const outcome = backend.bindResults?.[request.accelerator.text]

      if (outcome !== undefined) {
        return Promise.resolve(outcome)
      }

      return Promise.resolve({
        ok: true,
        trigger: request.accelerator.text,
        release: () => {
          backend.released.push(request.key)
          return Promise.resolve()
        },
      })
    },
    fire(key) {
      backend.presses.get(key)?.()
    },
    exit() {
      exitListener?.()
    },
    onExit(listener) {
      exitListener = listener
      return () => {
        exitListener = null
      }
    },
    ...overrides,
  } as FakeBackend

  return backend
}

const options = (id: string, accelerator = 'Ctrl+Alt+KeyK') => ({
  id,
  accelerator,
  onPress: () => {},
})

describe('createGlobalShortcuts', () => {
  it('registers and unregisters a shortcut', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const result = await shortcuts.register(options('a'))

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.shortcut.accelerator).toBe('Ctrl+Alt+KeyK')
    expect(result.shortcut.trigger).toBe('Ctrl+Alt+KeyK')
    expect(shortcuts.list().map((s) => s.id)).toEqual(['a'])

    expect(await shortcuts.unregister('a')).toBe(true)
    expect(backend.released).toEqual([1])
    expect(shortcuts.list()).toEqual([])
    expect(await shortcuts.unregister('a')).toBe(false)
  })

  it('delivers presses while the registration is live', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const seen: string[] = []
    const result = await shortcuts.register({
      id: 'a',
      accelerator: 'Ctrl+Alt+KeyK',
      onPress: (event) => seen.push(`${event.id}:${event.accelerator}`),
    })

    expect(result.ok).toBe(true)
    backend.fire(1)
    expect(seen).toEqual(['a:Ctrl+Alt+KeyK'])
    await shortcuts.unregister('a')
    backend.fire(1)
    expect(seen).toEqual(['a:Ctrl+Alt+KeyK'])
  })

  it('rejects a duplicate id', async () => {
    const shortcuts = createRegistry(fakeBackend()).createGlobalShortcuts()

    await shortcuts.register(options('a'))

    const again = await shortcuts.register({ ...options('a'), accelerator: 'Ctrl+Alt+KeyJ' })

    expect(again.ok).toBe(false)
    if (!again.ok) {
      expect(again.error.code).toBe('duplicate-id')
    }
  })

  it('rejects the same accelerator across instances in one process', async () => {
    const registry = createRegistry(fakeBackend())
    const first = registry.createGlobalShortcuts()
    const second = registry.createGlobalShortcuts()

    expect((await first.register(options('a'))).ok).toBe(true)

    const clash = await second.register(options('b'))

    expect(clash.ok).toBe(false)
    if (!clash.ok) {
      expect(clash.error.code).toBe('conflict')
    }

    // After the owner releases, the accelerator can be taken again.
    await first.unregister('a')
    expect((await second.register(options('b'))).ok).toBe(true)
  })

  it('rejects statically reserved accelerators before hitting the OS', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const result = await shortcuts.register(options('a', 'Ctrl+Alt+Delete'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('reserved')
    }

    expect(backend.requests).toEqual([])
  })

  it('honors backend dynamic reservations', async () => {
    const backend = fakeBackend({
      reserved: (accelerator) => (accelerator.code === 'Space' ? 'The desktop owns Space.' : null),
    })

    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const result = await shortcuts.register(options('a', 'Ctrl+Alt+Space'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('reserved')
      expect(result.error.message).toBe('The desktop owns Space.')
    }
  })

  it('propagates backend refusals', async () => {
    const backend = fakeBackend({
      bindResults: {
        'Ctrl+Alt+KeyK': {
          ok: false,
          error: { code: 'conflict', message: 'held by another app' },
        },
      },
    })

    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const result = await shortcuts.register(options('a'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('conflict')
      expect(result.error.id).toBe('a')
    }
  })

  it('rejects invalid accelerators without touching the OS', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const result = await shortcuts.register(options('a', 'k'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('invalid-accelerator')
    }

    expect(backend.requests).toEqual([])
  })

  it('throws TypeError for programmer errors', async () => {
    const shortcuts = createRegistry(fakeBackend()).createGlobalShortcuts()

    // @ts-expect-error runtime contract
    expect(() => shortcuts.register(null)).toThrow(TypeError)
    expect(() => shortcuts.register({ ...options(''), onPress: () => {} })).toThrow(TypeError)
    expect(() =>
      // @ts-expect-error runtime contract
      shortcuts.register({ id: 'a', accelerator: 'Ctrl+Alt+KeyK', onPress: 'no' }),
    ).toThrow(TypeError)
  })

  it('routes handler errors to onError instead of dropping them', async () => {
    const backend = fakeBackend()
    const onError = vi.fn()
    const shortcuts = createRegistry(backend).createGlobalShortcuts({ onError })
    const boom = new Error('boom')

    await shortcuts.register({
      id: 'a',
      accelerator: 'Ctrl+Alt+KeyK',
      onPress: () => {
        throw boom
      },
    })

    backend.fire(1)
    expect(onError).toHaveBeenCalledWith(boom)
    // Later presses still arrive.
    expect((await shortcuts.register({ ...options('b'), accelerator: 'Ctrl+Alt+KeyJ' })).ok).toBe(
      true,
    )
  })

  it('disposes all registrations and rejects later work', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()

    await shortcuts.register(options('a'))
    await shortcuts.register({ ...options('b'), accelerator: 'Ctrl+Alt+KeyJ' })
    await shortcuts.dispose()
    expect(shortcuts.disposed).toBe(true)
    expect(backend.released.sort()).toEqual([1, 2])
    expect(shortcuts.list()).toEqual([])

    const late = await shortcuts.register(options('c', 'Ctrl+Alt+KeyL'))

    expect(late.ok).toBe(false)
    if (!late.ok) {
      expect(late.error.code).toBe('disposed')
    }

    await shortcuts.dispose()
  })

  it('releases a bind that resolves after dispose raced it', async () => {
    const backend = fakeBackend()
    let resolveBind: ((outcome: BindOutcome) => void) | null = null

    backend.bind = (request, onPress) => {
      backend.requests.push(request)
      backend.presses.set(request.key, onPress)
      return new Promise((resolve) => {
        resolveBind = resolve
      })
    }

    const shortcuts = createRegistry(backend).createGlobalShortcuts()
    const pending = shortcuts.register(options('a'))

    await Promise.resolve()
    await shortcuts.dispose()

    let released = false

    resolveBind!({
      ok: true,
      trigger: 'Ctrl+Alt+KeyK',
      release: () => {
        released = true
        return Promise.resolve()
      },
    })

    const result = await pending

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('disposed')
    }

    expect(released).toBe(true)
  })

  it('disposes live instances on app exit', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()

    await shortcuts.register(options('a'))
    backend.exit()
    await Promise.resolve()
    await Promise.resolve()
    expect(shortcuts.disposed).toBe(true)
    expect(backend.released).toEqual([1])
  })

  it('unregisterAll keeps the instance usable', async () => {
    const backend = fakeBackend()
    const shortcuts = createRegistry(backend).createGlobalShortcuts()

    await shortcuts.register(options('a'))
    await shortcuts.register({ ...options('b'), accelerator: 'Ctrl+Alt+KeyJ' })
    await shortcuts.unregisterAll()
    expect(backend.released.sort()).toEqual([1, 2])
    expect(shortcuts.disposed).toBe(false)
    expect((await shortcuts.register({ ...options('c'), accelerator: 'Ctrl+Alt+KeyL' })).ok).toBe(
      true,
    )
  })
})

describe('unsupported entries', () => {
  it('default entry reports unsupported and refuses register', async () => {
    const entry = await import('../src/index')
    const support = await entry.getGlobalShortcutSupport()

    expect(support.supported).toBe(false)
    expect(support.mechanism).toBe('none')

    const shortcuts = entry.createGlobalShortcuts()
    const result = await shortcuts.register(options('a'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('unsupported')
    }
  })

  it('web entry reports unsupported with a browser reason', async () => {
    const entry = await import('../src/index.web')
    const support = await entry.getGlobalShortcutSupport()

    expect(support.supported).toBe(false)
    expect(support.platform).toBe('web')

    const result = await entry.createGlobalShortcuts().register(options('a'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('unsupported')
    }
  })

  it('unsupported entries still parse accelerators', async () => {
    const entry = await import('../src/index.web')
    const parsed = entry.parseAccelerator('Ctrl+Alt+KeyK', { platform: 'windows' })

    expect(parsed.ok).toBe(true)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { createAppMenuService } from '../src/controller'
import type { AppMenuHost, AppMenuDispatch, NativeAppMenu } from '../src/host-types'
import type { NormalizedAppMenu } from '../src/model'
import type { AppMenuEntry, AppMenuSubmenu } from '../src/shared'

interface Installed {
  tree: NormalizedAppMenu
  dispatch: AppMenuDispatch
  updates: NormalizedAppMenu[]
  disposed: number
}

function fakeHost(platform: 'macos' | 'linux' | 'windows' | null = 'linux') {
  const calls: string[] = []
  const deferred: (() => void)[] = []
  const installed: Installed[] = []
  let supported = true
  let installError: Error | null = null
  const host: AppMenuHost = {
    platform,
    supported: () => supported,
    defer: (fn) => deferred.push(fn),
    install(tree, dispatch) {
      if (installError) {
        throw installError
      }
      const record: Installed = { tree, dispatch, updates: [], disposed: 0 }
      installed.push(record)
      calls.push('install')
      const native: NativeAppMenu = {
        update(next) {
          record.updates.push(next)
          record.tree = next
          calls.push('native.update')
        },
        dispose() {
          record.disposed++
          calls.push('native.dispose')
        },
      }
      return native
    },
  }
  return {
    host,
    calls,
    deferred,
    installed,
    setSupported: (value: boolean) => {
      supported = value
    },
    setInstallError: (error: Error | null) => {
      installError = error
    },
    flush: () => {
      while (deferred.length) {
        deferred.shift()!()
      }
    },
  }
}

const menus = (items: readonly AppMenuEntry[] = []): AppMenuSubmenu[] => [
  { type: 'submenu', key: 'file', label: 'File', items },
]

const action = (key: string, onSelect = () => {}): AppMenuEntry => ({
  type: 'action',
  key,
  label: key.toUpperCase(),
  onSelect,
})

const checkbox = (key: string, value: boolean, onValueChange = (_v: boolean) => {}): AppMenuEntry => ({
  type: 'checkbox',
  key,
  label: key.toUpperCase(),
  value,
  onValueChange,
})

function idOf(installed: Installed, key: string): number {
  for (const [id, node] of installed.tree.nodes) {
    if (node.key === key) {
      return id
    }
  }
  throw new Error(`no node for key ${key}`)
}

afterEach(() => vi.restoreAllMocks())

describe('createAppMenuService', () => {
  it('reports support without throwing', () => {
    const f = fakeHost()
    f.setSupported(false)
    const service = createAppMenuService(f.host)
    expect(service.supported).toBe(false)
    f.setSupported(true)
    expect(service.supported).toBe(true)
  })

  it('install throws UnavailabilityError when unsupported', () => {
    const f = fakeHost()
    f.setSupported(false)
    const service = createAppMenuService(f.host)
    expect(() => service.install(menus())).toThrow(UnavailabilityError)
    expect(() => service.install(menus())).toThrow(/appMenu is unavailable/)
  })

  it('isAvailable resolves the supported flag and never rejects', async () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    await expect(service.isAvailable()).resolves.toBe(true)
    f.setSupported(false)
    await expect(service.isAvailable()).resolves.toBe(false)
    expect(service.supported).toBe(false)
  })

  it('isAvailable never rejects when the host probe throws', async () => {
    const host: AppMenuHost = {
      platform: 'linux',
      supported() {
        throw new Error('probe blew up')
      },
      defer: (fn) => fn(),
      install() {
        throw new Error('unreachable')
      },
    }
    const service = createAppMenuService(host)
    expect(service.supported).toBe(false)
    await expect(service.isAvailable()).resolves.toBe(false)
    expect(() => service.install(menus())).toThrow(UnavailabilityError)
  })

  it('enforces a single owner and frees the slot on dispose', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const first = service.install(menus())
    expect(() => service.install(menus())).toThrow(
      'An app menu is already installed; update or dispose it first',
    )
    first.dispose()
    expect(service.install(menus())).toBeTruthy()
  })

  it('update replaces the native tree and dispatch uses the new generation', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const hits: string[] = []
    const handle = service.install(menus([action('old', () => hits.push('old'))]))
    const installed = f.installed[0]!
    const oldId = idOf(installed, 'old')
    const oldGen = installed.tree.generation

    handle.update(menus([action('fresh', () => hits.push('fresh'))]))
    expect(f.calls).toContain('native.update')
    const newGen = installed.tree.generation
    expect(newGen).not.toBe(oldGen)
    installed.dispatch(oldId, oldGen) // stale generation
    expect(hits).toEqual([])
    installed.dispatch(idOf(installed, 'fresh'), newGen)
    expect(hits).toEqual(['fresh'])
  })

  it('dispose is idempotent and update after dispose throws', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const handle = service.install(menus())
    handle.dispose()
    expect(handle.isDisposed).toBe(true)
    handle.dispose()
    expect(f.calls.filter((call) => call === 'native.dispose')).toHaveLength(1)
    expect(() => handle.update(menus())).toThrow('App menu is disposed')
  })

  it('ignores stale generations and unknown ids', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const hits: string[] = []
    service.install(menus([action('a', () => hits.push('a'))]))
    const installed = f.installed[0]!
    const id = idOf(installed, 'a')
    const gen = installed.tree.generation
    expect(installed.dispatch(id, gen + 1)).toBe(false)
    expect(installed.dispatch(999, gen)).toBe(false)
    expect(hits).toEqual([])
  })

  it('checkboxes dispatch onValueChange with the controlled next value', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const seen: boolean[] = []
    const handle = service.install(menus([checkbox('wrap', true, (v) => seen.push(v))]))
    const installed = f.installed[0]!
    installed.dispatch(idOf(installed, 'wrap'), installed.tree.generation)
    expect(seen).toEqual([false])
    // The model value is controlled — the next update flips the reported value.
    handle.update(menus([checkbox('wrap', false, (v) => seen.push(v))]))
    installed.dispatch(idOf(installed, 'wrap'), installed.tree.generation)
    expect(seen).toEqual([false, true])
  })

  it('logs callback errors instead of breaking dispatch', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    service.install(menus([action('boom', () => {
      throw new Error('private handler details')
    })]))
    const installed = f.installed[0]!
    expect(() => installed.dispatch(idOf(installed, 'boom'), installed.tree.generation)).not.toThrow()
    expect(error).toHaveBeenCalledWith('[app-menu] menu action failed', expect.any(Error))
  })

  it('defers and coalesces native update/dispose issued during a callback', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    let handle!: ReturnType<typeof service.install>
    const hits: string[] = []
    handle = service.install(
      menus([
        action('trigger', () => {
          hits.push('trigger')
          handle.update(menus([action('next', () => hits.push('next'))]))
          // A second update inside the same dispatch must coalesce.
          handle.update(menus([action('last', () => hits.push('last'))]))
        }),
      ]),
    )
    const installed = f.installed[0]!
    const triggerGen = installed.tree.generation
    installed.dispatch(idOf(installed, 'trigger'), triggerGen)
    // Logical effect is immediate: the old tree's ids are already dead.
    expect(installed.dispatch(idOf(installed, 'trigger'), triggerGen)).toBe(false)
    // …while the native rebuild waits for the deferred flush and coalesces.
    expect(f.calls).not.toContain('native.update')
    expect(f.deferred).toHaveLength(1)
    f.flush()
    expect(f.calls.filter((c) => c === 'native.update')).toHaveLength(1)
    expect(installed.tree.menus[0]!.items[0]).toMatchObject({ key: 'last' })
    installed.dispatch(idOf(installed, 'last'), installed.tree.generation)
    expect(hits).toEqual(['trigger', 'last'])
  })

  it('defers dispose during a callback and lets it supersede a pending update', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    let handle!: ReturnType<typeof service.install>
    handle = service.install(
      menus([
        action('trigger', () => {
          handle.update(menus([action('next')]))
          handle.dispose()
        }),
      ]),
    )
    const installed = f.installed[0]!
    installed.dispatch(idOf(installed, 'trigger'), installed.tree.generation)
    expect(handle.isDisposed).toBe(true)
    expect(installed.dispatch(idOf(installed, 'trigger'), installed.tree.generation)).toBe(false)
    expect(f.calls).toEqual(['install'])
    f.flush()
    expect(f.calls).toEqual(['install', 'native.dispose'])
  })

  it('install flushes a pending teardown synchronously', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    let handle!: ReturnType<typeof service.install>
    handle = service.install(
      menus([action('trigger', () => handle.dispose())]),
    )
    const installed = f.installed[0]!
    installed.dispatch(idOf(installed, 'trigger'), installed.tree.generation)
    expect(f.calls).toEqual(['install'])
    service.install(menus())
    expect(f.calls).toEqual(['install', 'native.dispose', 'install'])
    // The queued deferred flush is a no-op now that install flushed it.
    f.flush()
    expect(f.calls).toEqual(['install', 'native.dispose', 'install'])
  })

  it('leaves the slot free when host.install throws', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    f.setInstallError(new Error('native write failed'))
    expect(() => service.install(menus())).toThrow('native write failed')
    f.setInstallError(null)
    expect(service.install(menus())).toBeTruthy()
  })

  it('validates before any native write on update', () => {
    const f = fakeHost()
    const service = createAppMenuService(f.host)
    const handle = service.install(menus([action('a')]))
    const gen = f.installed[0]!.tree.generation
    expect(() => handle.update(menus([action('a'), action('a')]))).toThrow(
      /duplicate sibling key/,
    )
    expect(f.calls).not.toContain('native.update')
    expect(f.installed[0]!.tree.generation).toBe(gen)
  })
})

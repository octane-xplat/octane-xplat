import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { normalizeAppMenu, type NormalizedAppMenu } from './model.js'
import type { AppMenu, AppMenuOptions, AppMenuService, AppMenuSubmenu } from './shared.js'
import type { AppMenuDispatch, AppMenuHost, NativeAppMenu } from './host-types.js'

/** Single-owner controller over the host adapter: validates payloads,
 *  assigns tree generations, gates native dispatch, and defers native
 *  updates/teardown that land inside a running callback. */
export function createAppMenuService(host: AppMenuHost): AppMenuService {
  let slot: { native: NativeAppMenu; tree: NormalizedAppMenu } | null = null
  let generation = 0
  let dispatching = 0
  // 'update' applies slot.tree (latest wins — already swapped logically);
  // 'dispose' tears down retired and always supersedes a pending update.
  let deferred: 'update' | 'dispose' | null = null
  let deferredScheduled = false
  let retired: NativeAppMenu | null = null

  function flushDeferred(): void {
    deferredScheduled = false
    const op = deferred
    deferred = null
    if (op === 'dispose') {
      const native = retired
      retired = null
      native?.dispose()
    } else if (op === 'update') {
      slot?.native.update(slot.tree)
    }
  }

  function requestDeferred(kind: 'update' | 'dispose'): void {
    if (kind === 'dispose' || deferred !== 'dispose') {
      deferred = kind
    }
    if (!deferredScheduled) {
      deferredScheduled = true
      host.defer(flushDeferred)
    }
  }

  const dispatch: AppMenuDispatch = (id, gen) => {
    const current = slot
    if (!current || gen !== current.tree.generation) {
      return false
    }
    const node = current.tree.nodes.get(id)
    if (!node) {
      return false
    }
    if (node.kind === 'role') {
      // Host-handled — current is all the host needs to know.
      return true
    }
    dispatching++
    try {
      if (node.kind === 'action') {
        node.onSelect()
      } else {
        node.onValueChange(!node.value)
      }
    } catch (error) {
      console.error('[app-menu] menu action failed', error)
    } finally {
      dispatching--
    }
    return true
  }

  function readSupported(): boolean {
    try {
      return Boolean(host.supported())
    } catch {
      return false
    }
  }

  return {
    get supported() {
      return readSupported()
    },
    isAvailable() {
      return Promise.resolve().then(readSupported)
    },
    install(menus: readonly AppMenuSubmenu[], options?: AppMenuOptions) {
      if (!readSupported()) {
        throw new UnavailabilityError('appMenu')
      }
      // A deferred teardown/update is a pending native write — settle it
      // before claiming the slot.
      flushDeferred()
      if (slot) {
        throw new Error('An app menu is already installed; update or dispose it first')
      }
      const tree = normalizeAppMenu(menus, options, host.platform, ++generation)
      // host.install throwing leaves the slot free for the next attempt.
      const native = host.install(tree, dispatch)
      slot = { native, tree }

      let disposed = false
      const handle: AppMenu = {
        get isDisposed() {
          return disposed
        },
        update(nextMenus: readonly AppMenuSubmenu[], nextOptions?: AppMenuOptions) {
          if (disposed) {
            throw new Error('App menu is disposed')
          }
          const next = normalizeAppMenu(nextMenus, nextOptions, host.platform, ++generation)
          // Logical swap is immediate — old-tree callbacks die on the
          // generation check; the native rebuild may defer.
          slot!.tree = next
          if (dispatching > 0) {
            requestDeferred('update')
          } else {
            slot!.native.update(next)
          }
        },
        dispose() {
          if (disposed) {
            return
          }
          disposed = true
          const native = slot!.native
          slot = null
          if (dispatching > 0) {
            retired = native
            requestDeferred('dispose')
          } else {
            native.dispose()
          }
        },
      }
      return handle
    },
  }
}

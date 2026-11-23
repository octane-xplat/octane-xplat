import { createInputCallbackGuard, guardInteractionCallbacks } from './callback-guard'
import { coreViewForHost } from '../internal/platform/core-view-for-host'
import type { NativeGestureView } from './input.native'
import { isNativeGestureView } from './native-host-lifecycle'
import {
  createInteractionBinding,
  type InteractionBindingOptions,
  type InteractionAdapter,
} from './host-binding'

import { createConvenienceInput } from './convenience'
import { createInteractionMembership } from './membership'
import { createInteractionHostRef } from './host-ref'
import type { InteractionHostOptions } from './host-options'
import type { InteractionScope } from './types'

// NativeScript and the desktop hosts provide these frame callbacks. Keep
// their native contract local; GTK typechecking does not load DOM globals.
declare function requestAnimationFrame(callback: (time: number) => void): number
declare function cancelAnimationFrame(handle: number): void

/** One NativeScript interaction host's state: callback guard, scope
 *  membership, convenience controllers, and the native binding with its
 *  load lifecycle. A component creates it once and drives it from a single
 *  layout effect, so a render costs a handful of hooks rather than one per
 *  piece of state. */
export function createNativeInteractionHost(
  adapter: InteractionAdapter<NativeGestureView>,
  isReady: ((host: NativeGestureView) => boolean) | undefined,
  scopes: readonly InteractionScope[],
  fail: (failure: { error: unknown }) => void,
) {
  const guard = createInputCallbackGuard(fail)
  const membership = createInteractionMembership(scopes)
  const convenience = createConvenienceInput()
  const binding = createInteractionBinding(adapter)
  let membershipScopes: readonly InteractionScope[] | null = null
  let observed: NativeGestureView | null = null
  let pendingLoad: number | null = null
  let loadEpoch = 0
  let committed: InteractionBindingOptions = {}

  function cancelLoad() {
    loadEpoch++
    if (pendingLoad !== null) {
      cancelAnimationFrame(pendingLoad)
      pendingLoad = null
    }
  }

  function clearLoaded() {
    cancelLoad()
    observed?.off('loaded', loaded)
    if (isReady) {
      observed?.off('layoutChanged', loaded)
    }

    observed?.off('unloaded', unloaded)
    observed = null
  }

  function sync() {
    const host = lifecycle.host,
      current = committed

    const needed = Boolean(current.gestures || current.scope || current.press || current.viewport)

    if (!host || !needed) {
      clearLoaded()
      binding.commit(null, {})
      return
    }

    if (!isNativeGestureView(host)) {
      throw new Error('Native gesture attachment requires a NativeScript view')
    }

    if (observed !== host) {
      clearLoaded()
      observed = host
      host.on('loaded', loaded)
      if (isReady) {
        host.on('layoutChanged', loaded)
      }

      host.on('unloaded', unloaded)
    }

    if (isReady ? isReady(host) : host.isLoaded !== false) {
      cancelLoad()
      binding.commit(host, current)
    }
  }

  function loaded() {
    if (!isReady) {
      sync()
      return
    }

    const ready = isReady
    const epoch = loadEpoch

    queueMicrotask(() => {
      if (loadEpoch !== epoch) {
        return
      }

      sync()
      if (loadEpoch !== epoch) {
        return
      }

      const host = observed

      // A retained UIKit host can reload before entering its window without
      // changing size. Retry once on a frame; do not poll detached hosts.
      if (!host || host.isLoaded === false || ready(host) || pendingLoad !== null) {
        return
      }

      pendingLoad = requestAnimationFrame(() => {
        if (loadEpoch !== epoch) {
          return
        }

        pendingLoad = null
        if (observed === host && host.isLoaded !== false) {
          sync()
        }
      })
    })
  }

  function unloaded() {
    cancelLoad()
    binding.detach()
  }

  const lifecycle = createInteractionHostRef<object>(
    (host) => {
      membership.bind(host)
      sync()
    },
    () => {
      clearLoaded()
      membership.bind(null)
      binding.detach()
    },
  )

  return {
    /** Host callback ref. */
    bind: (host: object | null) => lifecycle.bind(coreViewForHost(host)),
    /** Layout-phase commit of one render's options and enclosing scopes. */
    commit(options: InteractionHostOptions, enclosing: readonly InteractionScope[]) {
      if (enclosing !== membershipScopes) {
        membershipScopes = enclosing
        membership.commit(enclosing)
      }

      const guarded = guardInteractionCallbacks(options, guard.invoke)
      const snapshot = convenience.commit(guarded)

      if (!convenience.current(snapshot)) {
        return
      }

      committed = {
        gestures: snapshot.input,
        scope: options.interactionScope,
        press: guarded.press,
        viewport: options.viewport,
      }

      sync()
    },
    dispose() {
      guard.retire()
      membership.dispose()
      try {
        lifecycle.dispose()
      } finally {
        convenience.dispose()
      }
    },
  }
}

export type NativeInteractionHost = ReturnType<typeof createNativeInteractionHost>

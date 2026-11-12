import { useInteractionCallbacks } from './callbacks.tsrx'
import { useCallback, useInsertionEffect, useLayoutEffect, useRef } from 'octane'
import type { NativeGestureView } from './input.native'
import { isNativeGestureView } from './native-host-lifecycle'
import {
  createInteractionBinding,
  type InteractionBinding,
  type InteractionBindingOptions,
  type InteractionAdapter,
} from './host-binding'

import { createConvenienceInput, type ConvenienceInput } from './convenience'
import { useInteractionMembership } from './context.tsrx'
import { createInteractionHostRef, type InteractionHostRef } from './host-ref'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

export function useNativeInteractionHost(
  options: InteractionHostOptions,
  adapter: InteractionAdapter<NativeGestureView>,
  isReady?: (host: NativeGestureView) => boolean,
): (host: object | null) => void {
  const guarded = useInteractionCallbacks(options)
  const membership = useInteractionMembership()
  const convenienceRef = useRef<ConvenienceInput | null>(null)

  if (!convenienceRef.current) {
    convenienceRef.current = createConvenienceInput()
  }

  const convenience = convenienceRef.current
  const lifecycleRef = useRef<InteractionHostRef<object> | null>(null)
  const observed = useRef<NativeGestureView | null>(null)
  const pendingLoad = useRef<number | null>(null)
  const loadEpoch = useRef(0)
  const committed = useRef<InteractionBindingOptions>({})
  const ref = useRef<InteractionBinding<NativeGestureView> | null>(null)

  if (!ref.current) {
    ref.current = createInteractionBinding(adapter)
  }

  const binding = ref.current
  const cancelLoad = useCallback(() => {
    loadEpoch.current++
    if (pendingLoad.current !== null) {
      cancelAnimationFrame(pendingLoad.current)
      pendingLoad.current = null
    }
  }, [])

  const clearLoaded = useCallback(() => {
    cancelLoad()
    observed.current?.off('loaded', loaded)
    if (isReady) {
      observed.current?.off('layoutChanged', loaded)
    }

    observed.current?.off('unloaded', unloaded)
    observed.current = null
  }, [cancelLoad])

  const sync = useCallback(() => {
    const host = lifecycleRef.current?.host ?? null,
      current = committed.current

    const needed = Boolean(current.gestures || current.scope || current.press || current.viewport)

    if (!host || !needed) {
      clearLoaded()
      binding.commit(null, {})
      return
    }

    if (!isNativeGestureView(host)) {
      throw new Error('Native gesture attachment requires a NativeScript view')
    }

    if (observed.current !== host) {
      clearLoaded()
      observed.current = host
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
  }, [binding, cancelLoad, clearLoaded, isReady])

  const loaded = useCallback(() => {
    if (isReady) {
      const epoch = loadEpoch.current

      queueMicrotask(() => {
        if (loadEpoch.current !== epoch) {
          return
        }

        sync()
        if (loadEpoch.current !== epoch) {
          return
        }

        const host = observed.current

        // A retained UIKit host can reload before entering its window without
        // changing size. Retry once on a frame; do not poll detached hosts.
        if (!host || host.isLoaded === false || isReady(host) || pendingLoad.current !== null) {
          return
        }

        pendingLoad.current = requestAnimationFrame(() => {
          if (loadEpoch.current !== epoch) {
            return
          }

          pendingLoad.current = null
          if (observed.current === host && host.isLoaded !== false) {
            sync()
          }
        })
      })
    } else {
      sync()
    }
  }, [isReady, sync])

  const unloaded = useCallback(() => {
    cancelLoad()
    binding.detach()
  }, [binding, cancelLoad])

  if (!lifecycleRef.current) {
    lifecycleRef.current = createInteractionHostRef<object>(
      (host) => {
        membership(host)
        sync()
      },
      () => {
        clearLoaded()
        membership(null)
        binding.detach()
      },
    )
  }

  const lifecycle = lifecycleRef.current

  useLayoutEffect(() => {
    const snapshot = convenience.commit(guarded)

    if (!convenience.current(snapshot)) {
      return
    }

    committed.current = {
      gestures: snapshot.input,
      scope: options.interactionScope,
      press: guarded.press,
      viewport: options.viewport,
    }

    sync()
  }, [convenience, guarded, options, sync])

  useInsertionEffect(
    () => () => {
      try {
        lifecycle.dispose()
      } finally {
        convenience.dispose()
      }
    },
    [lifecycle, convenience],
  )

  return lifecycle.bind
}

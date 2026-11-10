import { useInteractionCallbacks } from './callbacks.tsrx'
import { useCallback, useInsertionEffect, useLayoutEffect, useRef } from 'octane'
import {
  attachNativeGesture,
  attachNativeInteractionScope,
  attachNativePress,
  registerNativeGestureViewport,
  type NativeGestureView,
} from './input.native'

import { nativeGestureSurface } from './native-surface'
import { observeNativePress } from './native-press'
import {
  createInteractionBinding,
  type InteractionBinding,
  type InteractionBindingOptions,
} from './host-binding'

import { createConvenienceInput, type ConvenienceInput } from './convenience'
import { useInteractionMembership } from './context.tsrx'
import { createInteractionHostRef, type InteractionHostRef } from './host-ref'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  const guarded = useInteractionCallbacks(options)
  const membership = useInteractionMembership()
  const convenienceRef = useRef<ConvenienceInput | null>(null)

  if (!convenienceRef.current) {
    convenienceRef.current = createConvenienceInput()
  }

  const convenience = convenienceRef.current
  const lifecycleRef = useRef<InteractionHostRef<object> | null>(null)
  const observed = useRef<NativeGestureView | null>(null)
  const committed = useRef<InteractionBindingOptions>({})
  const ref = useRef<InteractionBinding<NativeGestureView> | null>(null)

  if (!ref.current) {
    ref.current = createInteractionBinding({
      gestures: (host, gestures) => attachNativeGesture(nativeGestureSurface(host), gestures),
      scope: (host, scope) => attachNativeInteractionScope(nativeGestureSurface(host), scope),
      press: (host, press) =>
        attachNativePress(nativeGestureSurface(host), press, (registration, value) =>
          observeNativePress(host, registration, value),
        ),
      viewport: (host) => registerNativeGestureViewport(nativeGestureSurface(host)),
    })
  }

  const binding = ref.current
  const clearLoaded = useCallback(() => {
    observed.current?.off('loaded', sync)
    observed.current?.off('unloaded', unloaded)
    observed.current = null
  }, [])

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
      host.on('loaded', sync)
      host.on('unloaded', unloaded)
    }

    if (host.isLoaded !== false) {
      binding.commit(host, current)
    }
  }, [binding, clearLoaded])

  const unloaded = useCallback(() => binding.detach(), [binding])

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

function isNativeGestureView(host: object): host is NativeGestureView {
  return (
    'nativeViewProtected' in host &&
    'style' in host &&
    typeof host.style === 'object' &&
    'on' in host &&
    typeof host.on === 'function' &&
    'off' in host &&
    typeof host.off === 'function'
  )
}

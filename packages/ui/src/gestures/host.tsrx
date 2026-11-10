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

import { useGestureInput } from './convenience.tsrx'
import { useInteractionMembership } from './context.tsrx'
import { createInteractionHostRef, type InteractionHostRef } from './host-ref'
import type { GestureHostProps } from './types'
import type { PressOptions } from './press'

export interface InteractionHostOptions extends GestureHostProps {
  readonly press?: PressOptions
  readonly viewport?: boolean
}

export function useInteractionHost(
  options: InteractionHostOptions,
): (host: NativeGestureView | null) => void {
  const membership = useInteractionMembership()
  const input = useGestureInput(options)
  const lifecycleRef = useRef<InteractionHostRef<NativeGestureView> | null>(null)
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
  const sync = useCallback(() => {
    const host = lifecycleRef.current?.host ?? null

    if (host?.isLoaded !== false) {
      binding.commit(host, committed.current)
    }
  }, [binding])

  const unloaded = useCallback(() => binding.detach(), [binding])

  if (!lifecycleRef.current) {
    lifecycleRef.current = createInteractionHostRef(
      (host) => {
        observed.current = host
        membership(host)
        host.on('loaded', sync)
        host.on('unloaded', unloaded)
        sync()
      },
      () => {
        observed.current?.off('loaded', sync)
        observed.current?.off('unloaded', unloaded)
        observed.current = null
        membership(null)
        binding.detach()
      },
    )
  }

  const lifecycle = lifecycleRef.current

  useLayoutEffect(() => {
    committed.current = {
      gestures: input,
      scope: options.interactionScope,
      press: options.press,
      viewport: options.viewport,
    }

    sync()
  }, [input, options.interactionScope, options.press, options.viewport, sync])

  useInsertionEffect(() => () => lifecycle.dispose(), [lifecycle])
  return lifecycle.bind
}

import { useInteractionCallbacks } from './callbacks.tsrx'
import { useInsertionEffect, useLayoutEffect, useRef } from 'octane'
import { attachAppKitGesture, attachAppKitScope, attachAppKitPress } from './input.macos'

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
  const committed = useRef<InteractionBindingOptions>({})
  const ref = useRef<InteractionBinding<object> | null>(null)

  if (!ref.current) {
    ref.current = createInteractionBinding({
      gestures: attachAppKitGesture,
      scope: attachAppKitScope,
      press: attachAppKitPress,
      viewport: () => () => {},
    })
  }

  const binding = ref.current

  if (!lifecycleRef.current) {
    lifecycleRef.current = createInteractionHostRef(
      (host) => {
        membership(host)
        binding.commit(host, committed.current)
      },
      () => {
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

    binding.commit(lifecycle.host, committed.current)
  }, [binding, lifecycle, convenience, guarded, options])

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

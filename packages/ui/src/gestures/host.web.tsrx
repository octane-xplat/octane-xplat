import { useInsertionEffect, useLayoutEffect, useRef } from 'octane'
import {
  attachWebGesture,
  attachWebInteractionScope,
  attachWebPress,
  registerWebGestureViewport,
} from './input.web'

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
): (host: HTMLElement | null) => void {
  const membership = useInteractionMembership()
  const input = useGestureInput(options)
  const lifecycleRef = useRef<InteractionHostRef<HTMLElement> | null>(null)
  const committed = useRef<InteractionBindingOptions>({})
  const ref = useRef<InteractionBinding<HTMLElement> | null>(null)

  if (!ref.current) {
    ref.current = createInteractionBinding({
      gestures: attachWebGesture,
      scope: attachWebInteractionScope,
      press: attachWebPress,
      viewport: registerWebGestureViewport,
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
    committed.current = {
      gestures: input,
      scope: options.interactionScope,
      press: options.press,
      viewport: options.viewport,
    }

    binding.commit(lifecycle.host, committed.current)
  }, [binding, lifecycle, input, options.interactionScope, options.press, options.viewport])

  useInsertionEffect(() => () => lifecycle.dispose(), [lifecycle])
  return lifecycle.bind
}

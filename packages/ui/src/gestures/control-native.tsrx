import { useCallback, useRef, useLayoutEffect, useInsertionEffect } from 'octane'
import { useInteractionMembership } from './context.tsrx'
import { createInteractionHostRef, type InteractionHostRef } from './host-ref'
import type { ControlPanNotification, ControlPanOptions } from './control-types'

interface NativeControlDrag {
  readonly state: number | 'began' | 'moved' | 'ended' | 'cancelled'
  readonly deltaX?: number
  readonly deltaY?: number
  readonly dx?: number
  readonly dy?: number
}

/** Native controls retain their platform transport where shared app gestures are unsupported. */
export function useNativeControlPan(
  options: ControlPanOptions,
  notify: (event: ControlPanNotification) => void,
) {
  const membership = useInteractionMembership()
  const lifecycleRef = useRef<InteractionHostRef<object> | null>(null)
  const observed = useRef<NativeControlHost | null>(null)
  const committed = useRef({ options, notify })
  const active = useRef(false)
  const last = useRef<ControlPanNotification>({
    phase: 'finish',
    translation: { x: 0, y: 0 },
    startLocal: null,
    positionLocal: null,
    cancelled: false,
  })

  const cancel = useCallback(() => {
    if (!active.current) {
      return
    }

    active.current = false
    committed.current.notify({ ...last.current, phase: 'finish', cancelled: true })
  }, [])

  useLayoutEffect(() => {
    committed.current = { options, notify }
    if (!options.enabled) {
      cancel()
    }
  }, [options, notify, cancel])

  const onPan = useCallback((event: NativeControlDrag) => {
    const phase =
      event.state === 1 || event.state === 'began'
        ? 'start'
        : event.state === 2 || event.state === 'moved'
          ? 'update'
          : 'finish'

    if (phase === 'start') {
      active.current = committed.current.options.enabled
    }

    if (!active.current) {
      return
    }

    const sample: ControlPanNotification = {
      phase,
      translation: { x: event.deltaX ?? event.dx ?? 0, y: event.deltaY ?? event.dy ?? 0 },
      startLocal: null,
      positionLocal: null,
      cancelled: event.state === 0 || event.state === 'cancelled',
    }

    last.current = sample
    if (phase === 'finish') {
      active.current = false
    }

    committed.current.notify(sample)
  }, [])

  if (!lifecycleRef.current) {
    lifecycleRef.current = createInteractionHostRef<object>(
      (host) => {
        if (!isControlHost(host)) {
          throw new Error('Native control pan requires the platform view event surface')
        }

        observed.current = host
        membership(host)
        host.on('pan', onPan)
      },
      () => {
        cancel()
        observed.current?.off('pan', onPan)
        observed.current = null
        membership(null)
      },
    )
  }

  const lifecycle = lifecycleRef.current

  useInsertionEffect(() => () => lifecycle.dispose(), [lifecycle])
  return { ref: lifecycle.bind, onPan: undefined, nativeControl: true }
}

export type NativeControlPanBinding = ReturnType<typeof useNativeControlPan>

interface NativeControlHost {
  on(name: string, callback: (event: NativeControlDrag) => void): void
  off(name: string, callback: (event: NativeControlDrag) => void): void
}

function isControlHost(host: object): host is NativeControlHost {
  return (
    'on' in host && typeof host.on === 'function' && 'off' in host && typeof host.off === 'function'
  )
}

import { useControlPanGesture$ } from './hooks.tsrx'
import { useInteractionHost } from './host.tsrx'
import type { ControlPanNotification, ControlPanOptions } from './control-types'
import type { PanSample } from './types'

/** Built-in controls attach to the same owner as app gestures. */
export function useControlPan(
  options: ControlPanOptions,
  notify: (event: ControlPanNotification) => void,
) {
  const send = (phase: ControlPanNotification['phase'], sample: PanSample, cancelled = false) =>
    notify({
      phase,
      translation: sample.translation,
      startLocal: sample.startPosition.local,
      positionLocal: sample.position.local,
      cancelled,
    })

  const gesture = useControlPanGesture$({
    ...options,
    onStart: (sample) => send('start', sample),
    onUpdate: (sample) => send('update', sample),
    onFinalize: (terminal) => send('finish', terminal.sample, terminal.outcome === 'cancelled'),
  })

  return { ref: useInteractionHost({ gestures: gesture }), onPan: undefined, nativeControl: false }
}

export type ControlPanBinding = ReturnType<typeof useControlPan>

import { attachGtkGesture, attachGtkScope, attachGtkPress } from './input.gtk'
import { useHostInteraction } from './host-shared.tsrx'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

const adapter = {
  gestures: attachGtkGesture,
  scope: attachGtkScope,
  press: attachGtkPress,
  viewport: () => () => {},
}

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useHostInteraction(options, adapter, (callback) => {
    Promise.resolve().then(callback)
  })
}

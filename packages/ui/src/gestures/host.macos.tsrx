import { attachAppKitGesture, attachAppKitScope, attachAppKitPress } from './input.macos'
import { useHostInteraction } from './host-shared.tsrx'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

const adapter = {
  gestures: attachAppKitGesture,
  scope: attachAppKitScope,
  press: attachAppKitPress,
  viewport: () => () => {},
}

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useHostInteraction(options, adapter, queueMicrotask)
}

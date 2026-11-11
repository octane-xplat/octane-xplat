import { useNativeInteractionHost } from './host-native-shared.tsrx'
import {
  attachWindowsGesture,
  attachWindowsScope,
  attachWindowsPress,
  windowsInputReady,
} from './input.windows'

import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

const adapter = {
  gestures: attachWindowsGesture,
  scope: attachWindowsScope,
  press: attachWindowsPress,
  viewport: () => () => {},
}

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useNativeInteractionHost(options, adapter, windowsInputReady)
}

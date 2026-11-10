import { useNativeInteractionHost } from './host-native-shared.tsrx'
import {
  attachNativeGesture,
  attachNativeInteractionScope,
  attachNativePress,
  registerNativeGestureViewport,
  type NativeGestureView,
} from './input.native'

import { nativeGestureSurface } from './native-surface'
import { nativeInputReady } from './native-ready'
import { observeNativePress } from './native-press'
import type { InteractionAdapter } from './host-binding'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

const adapter: InteractionAdapter<NativeGestureView> = {
  gestures: (host, gestures) => attachNativeGesture(nativeGestureSurface(host), gestures),
  scope: (host, scope) => attachNativeInteractionScope(nativeGestureSurface(host), scope),
  press: (host, press) =>
    attachNativePress(nativeGestureSurface(host), press, (registration, value) =>
      observeNativePress(host, registration, value),
    ),
  viewport: (host) => registerNativeGestureViewport(nativeGestureSurface(host)),
}

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useNativeInteractionHost(options, adapter, nativeInputReady)
}

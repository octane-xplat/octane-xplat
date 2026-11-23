import { NSView } from '@octane-xplat/platform/macos'
import { useNativeInteractionHost } from './host-native-shared.tsrx'
import type { InteractionAdapter } from './host-binding'
import type { InteractionHostOptions } from './host-options'
import {
  appKitMouseSurface,
  attachAppKitGesture,
  attachAppKitScope,
} from './input.macos'
import { attachNativePress, type NativeGestureView } from './input.native'
import { observeNativePress } from './native-press'

function nativeView(host: NativeGestureView): NSView {
  const view = host.nativeViewProtected
  if (!(view instanceof NSView)) {
    throw new Error('AppKit gesture attachment requires a loaded NativeScript view')
  }

  return view
}

const adapter: InteractionAdapter<NativeGestureView> = {
  gestures: (host, gestures) => attachAppKitGesture(nativeView(host), gestures),
  scope: (host, scope) => attachAppKitScope(nativeView(host), scope),
  press: (host, options) =>
    attachNativePress(appKitMouseSurface(nativeView(host)), options, (registration, next) =>
      observeNativePress(host, registration, next),
    ),
  // NSScrollView owns wheel scrolling as it does for the AppKit renderer.
  viewport: () => () => {},
}

export type { InteractionHostOptions } from './host-options'

export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useNativeInteractionHost(options, adapter, (host) => {
    const view = host.nativeViewProtected
    // AppKit bridge handles expose native properties through getters.
    return host.isLoaded !== false && view instanceof NSView && Boolean(view.window?.contentView)
  })
}

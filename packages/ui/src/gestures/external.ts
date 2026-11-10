import { createExternalGestureInput } from './external-shared'
import {
  attachNativeGesture,
  attachNativePress,
  parentGestureSurface,
  type NativeGestureView,
} from './input.native'

import { nativeGestureSurface } from './native-surface'

function nativeHost(host: object): NativeGestureView {
  if (
    !('nativeViewProtected' in host) ||
    !('on' in host) ||
    typeof host.on !== 'function' ||
    !('off' in host) ||
    typeof host.off !== 'function' ||
    !('style' in host)
  ) {
    throw new Error('Native gesture input requires a NativeScript host')
  }

  return host as NativeGestureView
}

function loaded(host: object, attach: (view: NativeGestureView) => () => void): () => void {
  const view = nativeHost(host)
  let release: (() => void) | null = null
  const load = () => {
    if (!release) {
      release = attach(view)
    }
  }

  const unload = () => {
    const old = release

    release = null
    old?.()
  }

  view.on('loaded', load)
  view.on('unloaded', unload)
  try {
    if (view.isLoaded !== false) {
      load()
    }
  } catch (error) {
    view.off('loaded', load)
    view.off('unloaded', unload)
    throw error
  }

  return () => {
    view.off('loaded', load)
    view.off('unloaded', unload)
    unload()
  }
}

const input = createExternalGestureInput({
  pan: (host, gesture) =>
    loaded(host, (view) =>
      attachNativeGesture(parentGestureSurface(nativeGestureSurface(view)), gesture),
    ),
  press: (host, options) =>
    loaded(host, (view) => {
      const binding = attachNativePress(nativeGestureSurface(view), options, () => ({
        commit() {},
        dispose() {},
      }))

      return () => binding.dispose()
    }),
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

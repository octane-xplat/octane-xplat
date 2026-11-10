import { createExternalGestureInput } from './external-shared'
import {
  attachNativeGesture,
  attachNativePress,
  parentGestureSurface,
  type NativeGestureView,
} from './input.native'

import { nativeGestureSurface } from './native-surface'
import { nativeInputReady } from './native-ready'

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
  let alive = true
  const load = () => {
    if (alive && !release && nativeInputReady(view)) {
      release = attach(view)
    }
  }

  const unload = () => {
    const old = release

    release = null
    old?.()
  }

  const deferredLoad = () => {
    queueMicrotask(load)
  }

  view.on('loaded', deferredLoad)
  view.on('layoutChanged', deferredLoad)
  view.on('unloaded', unload)
  try {
    if (view.isLoaded !== false) {
      load()
    }
  } catch (error) {
    alive = false
    view.off('loaded', deferredLoad)
    view.off('layoutChanged', deferredLoad)
    view.off('unloaded', unload)
    throw error
  }

  return () => {
    alive = false
    view.off('loaded', deferredLoad)
    view.off('layoutChanged', deferredLoad)
    view.off('unloaded', unload)
    unload()
  }
}

const input = createExternalGestureInput({
  pan: (host, gesture, basis) =>
    loaded(host, (view) =>
      attachNativeGesture(
        basis === 'parent'
          ? parentGestureSurface(nativeGestureSurface(view))
          : nativeGestureSurface(view),
        gesture,
      ),
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

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'

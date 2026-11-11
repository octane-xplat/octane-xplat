import type { NativeGestureView } from './input.native'
import { nativeInputReady } from './native-ready'

export function isNativeGestureView(host: object): host is NativeGestureView {
  return (
    'style' in host &&
    typeof host.style === 'object' &&
    host.style !== null &&
    'on' in host &&
    typeof host.on === 'function' &&
    'off' in host &&
    typeof host.off === 'function'
  )
}

export function bindLoadedNativeHost(
  host: object,
  attach: (view: NativeGestureView) => () => void,
  isReady: (view: NativeGestureView) => boolean = nativeInputReady,
): () => void {
  if (!isNativeGestureView(host)) {
    throw new Error('Native gesture input requires a NativeScript host')
  }

  const view = host
  let release: (() => void) | null = null
  let alive = true
  const load = () => {
    if (alive && !release && isReady(view)) {
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

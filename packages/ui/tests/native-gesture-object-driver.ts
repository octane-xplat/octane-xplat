import {
  createObjectContainer,
  flushUniversalSync,
  type ObjectHostContainer,
} from 'octane/universal/native'

const listeners = new WeakMap<object, Map<string, (event: unknown) => void>>()

/** NativeScript base-View gesture subscriptions for object-driver fixtures.
 * String host events still use the real object driver; imperative native
 * subscriptions have their own lifecycle and dispatch path. */
export class NativeGestureView {
  addEventListener(name: string, callback: (event: unknown) => void) {
    let handlers = listeners.get(this)

    if (!handlers) {
      handlers = new Map()
      listeners.set(this, handlers)
    }

    handlers.set(name, callback)
  }

  removeEventListener(name: string, callback: (event: unknown) => void) {
    const handlers = listeners.get(this)

    if (handlers?.get(name) === callback) {
      handlers.delete(name)
    }
  }
}

export type NativeGestureContainer = ObjectHostContainer

export function createNativeGestureContainer(renderer = 'nativescript'): NativeGestureContainer {
  const container = createObjectContainer(renderer)
  const dispatch = container.dispatchEvent.bind(container)

  container.dispatchEvent = (host, name, event) => {
    const handler = typeof host === 'object' ? listeners.get(host)?.get(name) : undefined

    if (handler) {
      return flushUniversalSync(() => handler(event))
    }

    return dispatch(host, name, event)
  }

  return container
}

export function nativeGestureSubscriptions(host: object): readonly string[] {
  return [...(listeners.get(host)?.keys() ?? [])]
}

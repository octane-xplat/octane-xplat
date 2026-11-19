import { lookupGlobal, UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopActivateEvent, DesktopApp, DesktopBeforeQuitEvent } from './types.js'

export interface AppLifecycleHost {
  isReady(): boolean
  whenReady(): Promise<void>
  quit(): void
  addQuitGuard(guard: () => boolean): () => void
  addActivateHandler?(handler: (hasVisibleWindows: boolean) => boolean): () => void
}

function hostFor(bridge: string): AppLifecycleHost | undefined {
  const host = lookupGlobal([bridge])

  if (
    typeof host === 'object' &&
    host !== null &&
    'isReady' in host && typeof host.isReady === 'function' &&
    'whenReady' in host && typeof host.whenReady === 'function' &&
    'quit' in host && typeof host.quit === 'function' &&
    'addQuitGuard' in host && typeof host.addQuitGuard === 'function'
  ) {
    // The renderer installs this private protocol alongside its startup API.
    return host as AppLifecycleHost
  }
}

type BeforeQuitListener = (event: DesktopBeforeQuitEvent) => void
type ActivateListener = (event: DesktopActivateEvent, hasVisibleWindows: boolean) => void
type EventRegistration = ['before-quit', BeforeQuitListener] | ['activate', ActivateListener]

function cancelableEvent(): DesktopActivateEvent {
  let prevented = false
  return {
    get defaultPrevented() {
      return prevented
    },
    preventDefault() {
      prevented = true
    },
  }
}

function removeLast<Listener>(listeners: Listener[], listener: Listener) {
  const index = listeners.lastIndexOf(listener)
  if (index >= 0) listeners.splice(index, 1)
}


/** Build the app facade without reading native globals or installing callbacks at import. */
export function createAppLifecycle(bridge?: string | (() => AppLifecycleHost | undefined)): DesktopApp {
  const listeners: BeforeQuitListener[] = []
  let unsubscribe: (() => void) | undefined
  const activateListeners: ActivateListener[] = []
  let unsubscribeActivate: (() => void) | undefined

  function host() {
    return typeof bridge === 'function' ? bridge() : bridge ? hostFor(bridge) : undefined
  }

  function requireHost(): AppLifecycleHost {
    const available = host()

    if (!available) {
      throw new UnavailabilityError('app')
    }

    return available
  }

  function requestQuit() {
    const event = cancelableEvent()

    for (const listener of listeners.slice()) {
      try {
        listener(event)
      } catch (error) {
        event.preventDefault()
        console.error('[desktop] before-quit listener failed', error)
      }
    }

    return !event.defaultPrevented
  }

  function requestActivate(hasVisibleWindows: boolean) {
    const event = cancelableEvent()
    for (const listener of activateListeners.slice()) {
      try {
        listener(event, hasVisibleWindows)
      } catch (error) {
        console.error('[desktop] activate listener failed', error)
      }
    }
    return !event.defaultPrevented
  }

  return {
    get supported() {
      return host() !== undefined
    },
    get supportsActivate() {
      return typeof host()?.addActivateHandler === 'function'
    },
    isReady() {
      return host()?.isReady() ?? false
    },
    whenReady() {
      const available = host()

      return available ? available.whenReady() : Promise.reject(new UnavailabilityError('app'))
    },
    quit() {
      requireHost().quit()
    },
    on(...[event, listener]: EventRegistration) {
      if ((event !== 'activate' && event !== 'before-quit') || typeof listener !== 'function') {
        throw new TypeError('Expected a desktop app event listener')
      }

      if (event === 'activate') {
        const available = host()
        if (typeof available?.addActivateHandler !== 'function') {
          throw new UnavailabilityError('app.activate')
        }
        unsubscribeActivate ??= available.addActivateHandler(requestActivate)
        activateListeners.push(listener)
      } else {
        unsubscribe ??= requireHost().addQuitGuard(requestQuit)
        listeners.push(listener)
      }
      return this
    },
    off(...[event, listener]: EventRegistration) {
      if (event === 'activate') {
        removeLast(activateListeners, listener)
        if (activateListeners.length === 0) {
          unsubscribeActivate?.()
          unsubscribeActivate = undefined
        }
      } else if (event === 'before-quit') {
        removeLast(listeners, listener)
        if (listeners.length === 0) {
          unsubscribe?.()
          unsubscribe = undefined
        }
      } else {
        throw new TypeError('Unknown desktop app event')
      }
      return this
    },
  }
}

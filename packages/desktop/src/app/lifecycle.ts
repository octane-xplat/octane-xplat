import { lookupGlobal, UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SingleInstanceSupport } from './second-instance.js'
import type { DesktopActivateEvent, DesktopApp, DesktopBeforeQuitEvent, DesktopSecondInstanceEvent } from './types.js'

export interface AppLifecycleHost {
  isReady(): boolean
  whenReady(): Promise<void>
  quit(): void
  addQuitGuard(guard: () => boolean): () => void
  supportsSingleInstanceLock?(): boolean
  requestSingleInstanceLock?(): boolean
  supportsSecondInstance?(): boolean
  addSecondInstanceHandler?(handler: (argv: readonly string[], workingDirectory: string | undefined) => void): () => void
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
type SecondInstanceListener = (event: DesktopSecondInstanceEvent, argv: readonly string[], workingDirectory: string | undefined) => void
type EventRegistration = ['before-quit', BeforeQuitListener] | ['activate', ActivateListener] |
  ['second-instance', SecondInstanceListener]

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
export function createAppLifecycle(
  bridge?: string | (() => AppLifecycleHost | undefined),
  singleInstance?: SingleInstanceSupport,
): DesktopApp {
  const listeners: BeforeQuitListener[] = []
  let unsubscribe: (() => void) | undefined
  const activateListeners: ActivateListener[] = []
  let unsubscribeActivate: (() => void) | undefined
  const secondInstanceListeners: SecondInstanceListener[] = []
  let unsubscribeSecondInstance: (() => void) | undefined

  function host() {
    const available = typeof bridge === 'function' ? bridge() : bridge ? hostFor(bridge) : undefined
    return available && singleInstance ? { ...available, ...singleInstance } : available
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

  function notifySecondInstance(argv: readonly string[], workingDirectory: string | undefined) {
    for (const listener of secondInstanceListeners.slice()) {
      try {
        listener({ type: 'second-instance' }, argv.slice(), workingDirectory)
      } catch (error) {
        console.error('[desktop] second-instance listener failed', error)
      }
    }
  }

  return {
    get supported() {
      return host() !== undefined
    },
    get supportsActivate() {
      return typeof host()?.addActivateHandler === 'function'
    },
    get supportsSingleInstanceLock() {
      const available = host()
      return typeof available?.requestSingleInstanceLock === 'function' &&
        available.supportsSingleInstanceLock?.() === true
    },
    requestSingleInstanceLock() {
      const available = host()
      if (typeof available?.requestSingleInstanceLock !== 'function' ||
        available.supportsSingleInstanceLock?.() !== true) {
        throw new UnavailabilityError('app.requestSingleInstanceLock')
      }
      return available.requestSingleInstanceLock()
    },
    get supportsSecondInstance() {
      const available = host()
      return typeof available?.addSecondInstanceHandler === 'function' &&
        available.supportsSecondInstance?.() === true
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
      if ((event !== 'activate' && event !== 'before-quit' && event !== 'second-instance') || typeof listener !== 'function') {
        throw new TypeError('Expected a desktop app event listener')
      }

      if (event === 'activate') {
        const available = host()
        if (typeof available?.addActivateHandler !== 'function') {
          throw new UnavailabilityError('app.activate')
        }
        unsubscribeActivate ??= available.addActivateHandler(requestActivate)
        activateListeners.push(listener)
      } else if (event === 'second-instance') {
        const available = host()
        if (typeof available?.addSecondInstanceHandler !== 'function' ||
          available.supportsSecondInstance?.() !== true) {
          throw new UnavailabilityError('app.second-instance')
        }
        unsubscribeSecondInstance ??= available.addSecondInstanceHandler(notifySecondInstance)
        secondInstanceListeners.push(listener)
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
      } else if (event === 'second-instance') {
        removeLast(secondInstanceListeners, listener)
        if (secondInstanceListeners.length === 0) {
          unsubscribeSecondInstance?.()
          unsubscribeSecondInstance = undefined
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

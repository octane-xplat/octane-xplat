import { lookupGlobal, UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopApp, DesktopBeforeQuitEvent } from './types.js'

interface AppLifecycleHost {
  isReady(): boolean
  whenReady(): Promise<void>
  quit(): void
  addQuitGuard(guard: () => boolean): () => void
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

/** Build the app facade without reading native globals or installing callbacks at import. */
export function createAppLifecycle(bridge?: string): DesktopApp {
  const listeners: BeforeQuitListener[] = []
  let unsubscribe: (() => void) | undefined

  function host() {
    return bridge ? hostFor(bridge) : undefined
  }

  function requireHost(): AppLifecycleHost {
    const available = host()

    if (!available) {
      throw new UnavailabilityError('app')
    }

    return available
  }

  function requestQuit() {
    let prevented = false
    const event: DesktopBeforeQuitEvent = {
      get defaultPrevented() {
        return prevented
      },
      preventDefault() {
        prevented = true
      },
    }

    for (const listener of listeners.slice()) {
      try {
        listener(event)
      } catch (error) {
        event.preventDefault()
        console.error('[desktop] before-quit listener failed', error)
      }
    }

    return !prevented
  }

  return {
    get supported() {
      return host() !== undefined
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
    on(event, listener) {
      if (event !== 'before-quit' || typeof listener !== 'function') {
        throw new TypeError('Expected a before-quit listener')
      }

      const available = requireHost()

      unsubscribe ??= available.addQuitGuard(requestQuit)
      listeners.push(listener)
      return this
    },
    off(event, listener) {
      if (event !== 'before-quit') {
        throw new TypeError('Expected before-quit')
      }

      const index = listeners.lastIndexOf(listener)

      if (index >= 0) {
        listeners.splice(index, 1)
      }

      if (listeners.length === 0) {
        unsubscribe?.()
        unsubscribe = undefined
      }

      return this
    },
  }
}

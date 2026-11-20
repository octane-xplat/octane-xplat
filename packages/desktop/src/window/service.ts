import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopRectangle } from '../screen/types.js'
import type {
  DesktopWindow,
  DesktopWindowCloseEvent,
  DesktopWindowEvents,
  DesktopWindowOptions,
  DesktopWindowService,
} from './types.js'

export interface NativeWindowController<Window> {
  readonly window: Window
  readonly isClosed: boolean
  readonly closed: Promise<void>
  onCloseRequested: (() => boolean | void) | null
  close(): void
  setTitle(title: string): void
}

export type NativeWindowOpener<Window> = (
  options: DesktopWindowOptions & { kind: 'regular' },
) => NativeWindowController<Window>

interface NativeWindowActions<Window> {
  requestClose(window: Window): void
  present(window: Window): void
  hide(window: Window): void
  isVisible(window: Window): boolean
  minimize(window: Window): void
  restore(window: Window): void
  maximize(window: Window): void
  unmaximize(window: Window): void
  isMaximized(window: Window): boolean
  supportsMinimizedState?(window: Window): boolean
  isMinimized?(window: Window): boolean
  isFocused(window: Window): boolean
  observe(window: Window, onChange: (change: { moved: boolean; resized: boolean }) => void): () => void
  bounds?: {
    supported(window: Window): boolean
    get(window: Window): DesktopRectangle
    set(window: Window, bounds: DesktopRectangle): void
  }
}

interface DesktopWindowBinding<Window> {
  windows: DesktopWindowService
  getWindowOwner(parent: DesktopWindow): Window | undefined
}

/** Events that watch geometry or maximize state — the first registered
 *  listener starts native observation, the last removal disposes it. */
type ObservedEvent = 'move' | 'resize' | 'maximize' | 'unmaximize'
const OBSERVED: readonly ObservedEvent[] = ['move', 'resize', 'maximize', 'unmaximize']

export function createDesktopWindowService<Window>(
  getOpener: () => NativeWindowOpener<Window> | undefined,
  actions: NativeWindowActions<Window>,
  getPrimary?: () => NativeWindowController<Window> | undefined,
): DesktopWindowBinding<Window> {
  const owners = new WeakMap<DesktopWindow, NativeWindowController<Window>>()
  const handles = new Map<NativeWindowController<Window>, DesktopWindow>()
  /** `windows.open()` controllers in creation order; closed ones drop out. */
  const opened = new Set<NativeWindowController<Window>>()

  function wrap(controller: NativeWindowController<Window>): DesktopWindow {
    const cached = handles.get(controller)

    if (cached) {
      return cached
    }

    let native: NativeWindowController<Window> | null = controller
    let previousCloseRequest = native.onCloseRequested
    const listeners: { [Event in keyof DesktopWindowEvents]: DesktopWindowEvents[Event][] } = {
      close: [],
      closed: [],
      move: [],
      resize: [],
      maximize: [],
      unmaximize: [],
    }

    let dispatchingClose = false
    let destroyQueued = false
    let stopObservation: (() => void) | undefined
    let observedMaximized = false

    function liveWindow(): Window {
      if (!native || native.isClosed) {
        throw new Error('Cannot operate on a closed window')
      }
      return native.window
    }

    function requireBounds(window: Window, method: 'getBounds' | 'setBounds') {
      const bounds = actions.bounds
      if (!bounds?.supported(window)) throw new UnavailabilityError(`DesktopWindow.${method}`)
      return bounds
    }

    function requestClose(): boolean {
      if (!native || native.isClosed || dispatchingClose) {
        return false
      }

      let prevented = false
      const event: DesktopWindowCloseEvent = {
        get defaultPrevented() {
          return prevented
        },
        preventDefault() {
          prevented = true
        },
      }

      dispatchingClose = true
      try {
        if (previousCloseRequest?.call(native) === false) {
          event.preventDefault()
        }

        for (const listener of listeners.close.slice()) {
          try {
            listener.call(handle, event)
          } catch (error) {
            event.preventDefault()
            console.error('[desktop] window close listener failed', error)
          }
        }

        return !prevented && !destroyQueued
      } catch (error) {
        console.error('[desktop] window close handler failed', error)
        return false
      } finally {
        dispatchingClose = false
      }
    }

    function emit(event: ObservedEvent) {
      for (const listener of listeners[event].slice()) {
        try {
          listener.call(handle)
        } catch (error) {
          console.error(`[desktop] window ${event} listener failed`, error)
        }
      }
    }

    function ensureObservation() {
      if (stopObservation || !native || native.isClosed) {
        return
      }

      const window = native.window
      observedMaximized = actions.isMaximized(window)
      stopObservation = actions.observe(window, (change) => {
        try {
          // State transitions publish before geometry inside one native
          // notification so listeners read a settled maximized flag.
          const maximized = actions.isMaximized(window)

          if (maximized !== observedMaximized) {
            observedMaximized = maximized
            emit(maximized ? 'maximize' : 'unmaximize')
          }

          if (change.moved) {
            emit('move')
          }
          if (change.resized) {
            emit('resize')
          }
        } catch (error) {
          console.error('[desktop] window state observation failed', error)
        }
      })
    }

    function releaseObservation() {
      if (OBSERVED.some((event) => listeners[event].length > 0)) {
        return
      }

      stopObservation?.()
      stopObservation = undefined
    }

    const handle: DesktopWindow = {
      get isClosed() {
        return native?.isClosed ?? true
      },
      closed: native.closed,
      close() {
        if (native && !native.isClosed && !dispatchingClose && !destroyQueued) {
          actions.requestClose(native.window)
        }
      },
      destroy() {
        if (!native || native.isClosed || destroyQueued) {
          return
        }

        if (dispatchingClose) {
          // Leave the native close callback before destroying its window.
          destroyQueued = true
          void Promise.resolve().then(() => {
            destroyQueued = false
            try {
              handle.destroy()
            } catch (error) {
              console.error('[desktop] window destruction failed', error)
            }
          })
          return
        }

        native.close()
      },
      show() {
        actions.present(liveWindow())
      },
      hide() {
        actions.hide(liveWindow())
      },
      focus() {
        const window = liveWindow()
        if (actions.isVisible(window)) {
          actions.present(window)
        }
      },
      isVisible() {
        return native !== null && !native.isClosed && actions.isVisible(native.window)
      },
      minimize() {
        actions.minimize(liveWindow())
      },
      restore() {
        actions.restore(liveWindow())
      },
      maximize() {
        actions.maximize(liveWindow())
      },
      unmaximize() {
        actions.unmaximize(liveWindow())
      },
      isMaximized() {
        return actions.isMaximized(liveWindow())
      },
      get supportsMinimizedState() {
        return !!(
          native &&
          !native.isClosed &&
          actions.isMinimized &&
          (actions.supportsMinimizedState?.(native.window) ?? true)
        )
      },
      isMinimized() {
        if (!actions.isMinimized) {
          throw new UnavailabilityError('DesktopWindow.isMinimized')
        }
        return actions.isMinimized(liveWindow())
      },
      get supportsBounds() {
        return !!(native && !native.isClosed && actions.bounds?.supported(native.window))
      },
      getBounds() {
        const window = liveWindow()
        return requireBounds(window, 'getBounds').get(window)
      },
      setBounds(bounds) {
        const window = liveWindow()
        const placement = requireBounds(window, 'setBounds')
        const current = placement.get(window)
        const { x = current.x, y = current.y, width = current.width, height = current.height } = bounds
        if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
          throw new RangeError('Window bounds require finite coordinates and a positive size')
        }
        placement.set(window, { x, y, width, height })
      },
      setTitle(title) {
        if (!native || native.isClosed) {
          throw new Error('Cannot set the title of a closed window')
        }

        native.setTitle(title)
      },
      on(event, listener) {
        if (!native || native.isClosed) {
          return this
        }

        if ((event === 'move' || event === 'resize') && !this.supportsBounds) {
          throw new UnavailabilityError(`DesktopWindow.${event}`)
        }

        // Observation installs before the listener registers so a native
        // failure never leaves an undeliverable subscription behind.
        if (event !== 'close' && event !== 'closed') {
          ensureObservation()
        }

        listeners[event].push(listener)
        return this
      },
      off(event, listener) {
        const list = listeners[event]
        const index = list.lastIndexOf(listener)

        if (index >= 0) {
          list.splice(index, 1)
        }

        releaseObservation()
        return this
      },
    }

    native.onCloseRequested = requestClose
    owners.set(handle, native)
    handles.set(native, handle)
    void native.closed.then(() => {
      owners.delete(handle)
      handles.delete(controller)
      opened.delete(controller)
      if (native?.onCloseRequested === requestClose) {
        native.onCloseRequested = null
      }
      native = null
      previousCloseRequest = null
      stopObservation?.()
      stopObservation = undefined

      const closedListeners = listeners.closed.splice(0)

      listeners.close.length = 0
      listeners.move.length = 0
      listeners.resize.length = 0
      listeners.maximize.length = 0
      listeners.unmaximize.length = 0
      for (const listener of closedListeners) {
        try {
          listener.call(handle)
        } catch (error) {
          console.error('[desktop] window closed listener failed', error)
        }
      }
    })

    return handle
  }

  function liveControllers(): NativeWindowController<Window>[] {
    const controllers: NativeWindowController<Window>[] = []
    const primary = getPrimary?.()

    if (primary && !primary.isClosed) {
      controllers.push(primary)
    }

    for (const controller of opened) {
      if (controller !== primary && !controller.isClosed) {
        controllers.push(controller)
      }
    }

    return controllers
  }

  const windows: DesktopWindowService = {
    get supported() {
      return getOpener() !== undefined
    },
    open(options = {}) {
      const open = getOpener()

      if (!open) {
        throw new UnavailabilityError('windows.open')
      }

      const controller = open({
        data: options.data,
        title: options.title,
        size: options.size,
        kind: 'regular',
      })

      opened.add(controller)
      return wrap(controller)
    },
    getAllWindows() {
      return liveControllers().map((controller) => wrap(controller))
    },
    getFocusedWindow() {
      for (const controller of liveControllers()) {
        if (actions.isFocused(controller.window)) {
          return wrap(controller)
        }
      }

      return null
    },
  }

  return {
    windows,
    getWindowOwner(parent) {
      const owner = owners.get(parent)
      return owner && !owner.isClosed ? owner.window : undefined
    },
  }
}
